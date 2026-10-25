import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../hero-immersive.js", import.meta.url), "utf8");
const markup = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = readFileSync(new URL("../hero-immersive.css", import.meta.url), "utf8");

function setup({ matches = true } = {}) {
  const events = new Map();
  const raf = [];
  const props = new Map();
  const classes = new Set();
  let offset = 0;
  const journey = {
    offsetHeight: 2050,
    getBoundingClientRect: () => ({ top: offset }),
    style: {
      setProperty: (key, value) => props.set(key, value),
      removeProperty: key => props.delete(key)
    },
    classList: {
      toggle: (key, yes) => yes ? classes.add(key) : classes.delete(key),
      remove: key => classes.delete(key)
    }
  };
  const media = {
    matches,
    addEventListener: (_name, cb) => events.set("change", cb)
  };
  const window = {
    innerHeight: 1000,
    matchMedia: () => media,
    requestAnimationFrame: callback => raf.push(callback),
    addEventListener: (name, cb) => events.set(name, cb)
  };
  const document = { getElementById: id => id === "heroJourney" ? journey : null };
  runInNewContext(script, { window, document });

  const flush = () => {
    while (raf.length) raf.shift()();
  };
  return {
    props,
    classes,
    media,
    flush,
    scroll(top) {
      offset = top;
      events.get("scroll")();
      flush();
    },
    updateMedia(value) {
      media.matches = value;
      events.get("change")();
      flush();
    }
  };
}

test("hero is attached without modifying navigation or search markup", () => {
  assert.match(markup, /id="heroJourney"/);
  assert.match(markup, /<form class="search-panel" id="heroSearch">/);
  assert.match(markup, /<nav class="desktop-nav"/);
  assert.match(markup, /hero-immersive\.css\?v=20261025-1/);
  assert.match(markup, /hero-immersive\.js\?v=20261025-1/);
});

test("idle zoom is separate from scroll transform and respects reduced motion", () => {
  assert.match(styles, /\.hero-media::before/);
  assert.match(styles, /animation: aupHeroBreathe/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /min-width: 1024px/);
});

test("scroll zoom interpolates across the pinned hero", () => {
  const v = setup();
  v.flush();
  assert.equal(v.props.get("--hero-scale"), "1.0600");
  v.scroll(-525);
  assert.equal(v.props.get("--hero-scale"), "1.1600");
  assert.equal(v.props.get("--hero-shift"), "-1.25%");
  assert.equal(v.props.get("--hero-cue-opacity"), "0.000");
  v.scroll(-1050);
  assert.equal(v.props.get("--hero-scale"), "1.2600");
  assert.equal(v.props.get("--hero-shift"), "-2.50%");
  v.scroll(0);
  assert.equal(v.props.get("--hero-scale"), "1.0600");
  assert.equal(v.props.get("--hero-cue-opacity"), "1.000");
});

test("touch/mobile or reduced-motion mode removes inline motion state", () => {
  const v = setup();
  v.flush();
  v.scroll(-800);
  v.updateMedia(false);
  assert.equal(v.props.has("--hero-scale"), false);
  assert.equal(v.props.has("--hero-shift"), false);
  assert.equal(v.props.has("--hero-cue-opacity"), false);
});

test("native scrolling is never hijacked", () => {
  assert.doesNotMatch(script, /preventDefault\s*\(/);
  assert.doesNotMatch(script, /addEventListener\s*\(\s*["']wheel["']/);
  assert.doesNotMatch(script, /window\.scrollTo\s*\(/);
});
