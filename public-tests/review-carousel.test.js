import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';

const markup = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../review-carousel.js', import.meta.url), 'utf8');

function setup({ mobile = true, reduced = false, count = 3 } = {}) {
  const { document, window: dom } = parseHTML(markup);
  const track = document.querySelector('#reviewTrack');
  [...track.children].slice(count).forEach(card => card.remove());
  const cards = [...track.children], timers = new Map(), frames = new Map(), listeners = new Map(), mediaListeners = new Map(), calls = [];
  let id = 0, stride = 374;
  const media = { matches: mobile, addEventListener: (event, callback) => mediaListeners.set(event, callback) };
  cards.forEach((card, i) => Object.defineProperty(card, 'offsetLeft', { get: () => 40 + i * stride }));
  track.scrollLeft = 0;
  track.scrollTo = options => { calls.push(options); track.scrollLeft = options.left; };
  const runtime = {
    matchMedia: query => query.includes('max-width') ? media : { matches: reduced },
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: key => frames.delete(key),
    addEventListener: (event, callback) => listeners.set(event, callback)
  };
  runInNewContext(script, {
    document, window: runtime,
    setTimeout: callback => { timers.set(++id, callback); return id; },
    clearTimeout: key => timers.delete(key)
  });
  const flushFrames = () => { for (const [key, callback] of [...frames]) { frames.delete(key); callback(); } };
  const flushTimers = () => { for (const [key, callback] of [...timers]) { timers.delete(key); callback(); } };
  flushFrames();
  const previous = document.querySelector('[data-review-prev]'), next = document.querySelector('[data-review-next]');
  return {
    document, track, cards, calls, previous, next,
    controls: document.querySelector('.review-carousel-controls'),
    counter: () => document.querySelector('.review-carousel-count').textContent,
    swipe(left) { track.scrollLeft = left; track.dispatchEvent(new dom.Event('scroll')); flushTimers(); },
    key(key, options = {}, target = track) {
      const event = Object.assign(new dom.Event('keydown', { bubbles: true, cancelable: true }), { key, ...options });
      target.dispatchEvent(event); return event;
    },
    mode(matches) { media.matches = matches; mediaListeners.get('change')(); flushFrames(); },
    resize(nextStride) { stride = nextStride; listeners.get('resize')(); flushFrames(); },
    language(value) { document.documentElement.lang = value; document.querySelector('#languageToggle').click(); flushFrames(); }
  };
}

test('mobile exposes one review, an announced position and bounded navigation', () => {
  const p = setup();
  assert.equal(p.controls.hidden, false);
  assert.equal(p.track.getAttribute('tabindex'), '0');
  assert.equal(p.counter(), '01 / 03');
  assert.equal(p.previous.disabled, true);
  assert.equal(p.next.disabled, false);
  assert.deepEqual(p.cards.map(card => card.getAttribute('aria-hidden')), ['false', 'true', 'true']);
  assert.equal(p.cards[0].querySelector('.review-stars').getAttribute('aria-label'), '5 out of 5 stars');
});

test('repeated next/previous clicks clamp at the ends and keep progress in sync', () => {
  const p = setup();
  for (let i = 0; i < 5; i++) p.next.click();
  assert.equal(p.counter(), '03 / 03');
  assert.equal(p.track.scrollLeft, 748);
  assert.equal(p.next.disabled, true);
  assert.equal(p.cards[2].getAttribute('aria-hidden'), 'false');
  assert.equal(p.document.querySelector('.review-carousel-dots .is-active'), p.document.querySelector('.review-carousel-dots').lastElementChild);
  for (let i = 0; i < 5; i++) p.previous.click();
  assert.equal(p.counter(), '01 / 03');
  assert.equal(p.track.scrollLeft, 0);
});

test('native swipe position selects the nearest review and updates the accessible state', () => {
  const p = setup();
  p.swipe(380);
  assert.equal(p.counter(), '02 / 03');
  assert.equal(p.cards[1].getAttribute('aria-hidden'), 'false');
  p.swipe(744);
  assert.equal(p.counter(), '03 / 03');
  assert.equal(p.next.disabled, true);
  p.swipe(-10);
  assert.equal(p.counter(), '01 / 03');
});

test('keyboard arrows, Home and End navigate without intercepting vertical or modified keys', () => {
  const p = setup();
  assert.equal(p.key('ArrowRight').defaultPrevented, true);
  assert.equal(p.counter(), '02 / 03');
  p.key('End'); assert.equal(p.counter(), '03 / 03');
  p.key('ArrowLeft'); assert.equal(p.counter(), '02 / 03');
  p.key('Home'); assert.equal(p.counter(), '01 / 03');
  assert.equal(p.key('ArrowDown').defaultPrevented, false);
  assert.equal(p.key('ArrowRight', { ctrlKey: true }).defaultPrevented, false);
  assert.equal(p.key('ArrowRight', {}, p.cards[0]).defaultPrevented, false);
  assert.equal(p.counter(), '01 / 03');
});

test('reduced motion removes programmatic slide animation', () => {
  const normal = setup(), reduced = setup({ reduced: true });
  normal.next.click(); reduced.next.click();
  assert.equal(normal.calls.at(-1).behavior, 'smooth');
  assert.equal(reduced.calls.at(-1).behavior, 'auto');
});

test('desktop restores every review and mobile resumes the previous position after resize', () => {
  const p = setup(); p.next.click(); p.next.click();
  p.mode(false);
  assert.equal(p.controls.hidden, true);
  assert.equal(p.track.hasAttribute('tabindex'), false);
  assert.equal(p.track.hasAttribute('aria-roledescription'), false);
  assert.ok(p.cards.every(card => !card.hasAttribute('aria-hidden') && !card.hasAttribute('aria-label')));
  assert.equal(p.key('ArrowRight').defaultPrevented, false);
  p.mode(true); p.resize(290);
  assert.equal(p.counter(), '03 / 03');
  assert.equal(p.track.scrollLeft, 580);
});

test('language changes preserve the selected review and translate controls and star labels', () => {
  const p = setup(); p.next.click();
  p.cards[1].querySelector('.review-stars').textContent = '★★★★☆';
  p.language('id');
  assert.equal(p.counter(), '02 / 03');
  assert.equal(p.next.getAttribute('aria-label'), 'Ulasan berikutnya');
  assert.equal(p.cards[1].getAttribute('aria-label'), 'Ulasan 2 dari 3');
  assert.equal(p.cards[1].querySelector('.review-stars').getAttribute('aria-label'), '4 dari 5 bintang');
  p.language('en');
  assert.equal(p.previous.getAttribute('aria-label'), 'Previous review');
  assert.equal(p.counter(), '02 / 03');
});

test('a single review hides unnecessary navigation and an empty carousel is a no-op', () => {
  const single = setup({ count: 1 });
  assert.equal(single.controls.hidden, true);
  assert.equal(single.counter(), '01 / 01');
  assert.equal(single.previous.disabled, true);
  assert.equal(single.next.disabled, true);
  assert.doesNotThrow(() => setup({ count: 0 }));
  assert.doesNotThrow(() => runInNewContext(script, { document: { getElementById: () => null } }));
});
