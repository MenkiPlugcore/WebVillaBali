/* Agung Ubud cinematic hero: native scrolling, no wheel interception. */
(() => {
  "use strict";
  const journey = document.getElementById("heroJourney");
  if (!journey) return;

  const enabled = window.matchMedia(
    "(min-width: 1024px) and (min-height: 720px) and (hover: hover) and (prefers-reduced-motion: no-preference)"
  );
  let pending = false;
  const clamp = value => Math.max(0, Math.min(1, value));

  function paint() {
    pending = false;
    if (!enabled.matches) {
      journey.classList.remove("is-scrubbing");
      journey.style.removeProperty("--hero-scale");
      journey.style.removeProperty("--hero-shift");
      journey.style.removeProperty("--hero-cue-opacity");
      return;
    }
    const rect = journey.getBoundingClientRect();
    const travel = Math.max(1, journey.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / travel);
    journey.style.setProperty("--hero-scale", (1.06 + progress * .20).toFixed(4));
    journey.style.setProperty("--hero-shift", (-progress * 2.5).toFixed(2) + "%");
    journey.style.setProperty("--hero-cue-opacity", (1 - clamp(progress * 4)).toFixed(3));
    journey.classList.toggle("is-scrubbing", progress > .004);
  }

  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(paint);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  if (enabled.addEventListener) enabled.addEventListener("change", schedule);
  else if (enabled.addListener) enabled.addListener(schedule);
  schedule();
})();
