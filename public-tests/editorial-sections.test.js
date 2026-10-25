import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const homepage = readFileSync(new URL("index.html", root), "utf8");
const styles = readFileSync(new URL("editorial-sections.css", root), "utf8");
const stylesheet = '<link rel="stylesheet" href="/editorial-sections.css?v=20261026-1">';

test("homepage loads editorial CSS exactly once after the mobile stylesheet", () => {
  assert.equal(homepage.split(stylesheet).length, 2);
  assert.ok(homepage.indexOf(stylesheet) > homepage.indexOf("property-intro-mobile.css"));
});

test("styling targets existing page sections without replacing their markup", () => {
  for (const id of ["properties", "propertyTypes", "locations", "services"]) {
    assert.match(homepage, new RegExp('id="' + id + '"'));
    assert.ok(styles.includes("#" + id), id);
  }
  assert.match(homepage, /id="heroSearch"/);
  assert.match(homepage, /id="propertyGrid"/);
  assert.match(homepage, /id="filterRow"/);
  assert.match(homepage, /id="contactForm"/);
});

test("mobile filter layout and reduced-motion support are preserved", () => {
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /#properties \.catalog-intro \.eyebrow \{ color: #e4d7bc; \}/);
  assert.match(styles, /#properties \.filter-chip \{[\s\S]*min-height: 44px/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("catalogue and payment scripts are not duplicated in the homepage", () => {
  for (const file of ["public-catalog.js", "script.js", "inquiry.js"]) {
    assert.equal(homepage.split('src="' + file + "?").length, 2, file);
  }
});

test("all CSS rules have matching braces", () => {
  const open = (styles.match(/\{/g) || []).length;
  const close = (styles.match(/\}/g) || []).length;
  assert.equal(open, close);
});
