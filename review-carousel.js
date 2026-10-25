(() => {
  const section = document.getElementById('reviews');
  const track = section?.querySelector('#reviewTrack');
  const cards = [...(track?.querySelectorAll('.review-card') || [])];
  const controls = section?.querySelector('.review-carousel-controls');
  if (!track || !cards.length || !controls) return;

  const previous = controls.querySelector('[data-review-prev]');
  const next = controls.querySelector('[data-review-next]');
  const counter = controls.querySelector('.review-carousel-count');
  const dots = controls.querySelector('.review-carousel-dots');
  const mobile = window.matchMedia('(max-width: 720px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, scrollTimer, resizeFrame;
  const copy = {
    en: { browse: 'Client stories. Swipe or use left and right arrow keys to browse.', carousel: 'carousel', slide: 'slide', previous: 'Previous review', next: 'Next review', position: (n, total) => `Review ${n} of ${total}`, stars: n => `${n} out of 5 stars` },
    id: { browse: 'Cerita klien. Geser atau gunakan tombol panah kiri dan kanan untuk membaca.', carousel: 'karusel', slide: 'slide', previous: 'Ulasan sebelumnya', next: 'Ulasan berikutnya', position: (n, total) => `Ulasan ${n} dari ${total}`, stars: n => `${n} dari 5 bintang` }
  };
  const language = () => copy[document.documentElement.lang] || copy.en;
  cards.forEach(() => dots.appendChild(document.createElement('span')));
  const offset = i => cards[i].offsetLeft - cards[0].offsetLeft;

  function render() {
    const t = language();
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    counter.setAttribute('aria-label', t.position(index + 1, cards.length));
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    previous.setAttribute('aria-label', t.previous);
    next.setAttribute('aria-label', t.next);
    [...dots.children].forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    cards.forEach((card, i) => {
      const stars = card.querySelector('.review-stars');
      stars?.setAttribute('role', 'img');
      if (stars) stars.setAttribute('aria-label', t.stars((stars.textContent.match(/★/g) || []).length));
      if (mobile.matches) {
        card.setAttribute('role', 'group');
        card.setAttribute('aria-roledescription', t.slide);
        card.setAttribute('aria-label', t.position(i + 1, cards.length));
        card.setAttribute('aria-hidden', String(i !== index));
      }
    });
    if (mobile.matches) {
      track.setAttribute('aria-label', t.browse);
      track.setAttribute('aria-roledescription', t.carousel);
    }
  }

  function go(target, instant = false) {
    if (!mobile.matches) return;
    index = Math.max(0, Math.min(cards.length - 1, target));
    render();
    track.scrollTo({ left: offset(index), behavior: instant || reduced.matches ? 'auto' : 'smooth' });
  }

  function align() {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => go(index, true));
  }

  function syncMode() {
    clearTimeout(scrollTimer);
    controls.hidden = !mobile.matches || cards.length < 2;
    if (mobile.matches) {
      track.setAttribute('role', 'region');
      track.setAttribute('tabindex', '0');
      align();
    } else {
      ['role', 'tabindex', 'aria-label', 'aria-roledescription'].forEach(name => track.removeAttribute(name));
      cards.forEach(card => ['role', 'aria-roledescription', 'aria-label', 'aria-hidden'].forEach(name => card.removeAttribute(name)));
      track.scrollTo({ left: 0, behavior: 'auto' });
    }
    render();
  }

  previous.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    if (!mobile.matches) return;
    scrollTimer = setTimeout(() => {
      if (!mobile.matches) return;
      index = cards.reduce((nearest, _, i) => Math.abs(offset(i) - track.scrollLeft) < Math.abs(offset(nearest) - track.scrollLeft) ? i : nearest, 0);
      render();
    }, 100);
  }, { passive: true });
  track.addEventListener('keydown', event => {
    if (!mobile.matches || event.target !== track || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: cards.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    go(target);
  });
  mobile.addEventListener('change', syncMode);
  window.addEventListener('resize', () => { if (mobile.matches) align(); });
  document.getElementById('languageToggle')?.addEventListener('click', () => { render(); if (mobile.matches) align(); });
  syncMode();
})();
