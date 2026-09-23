(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  requestAnimationFrame(() => header.classList.add('nav-mounted'));

  const syncHeader = () => {
    const scrolled = window.scrollY > 24;
    header.classList.toggle('nav-scrolled', scrolled);
  };

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  // Homepage guest-documentation concept preview. The dedicated gallery page
  // already loads these assets directly, so only inject them on the homepage.
  if (!document.body.classList.contains('guest-moments-page') && document.getElementById('reviews')) {
    if (!document.querySelector('link[data-guest-moments-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'guest-moments.css';
      style.dataset.guestMomentsStyle = 'true';
      document.head.appendChild(style);
    }
    if (!document.querySelector('script[data-guest-moments-script]')) {
      const script = document.createElement('script');
      script.src = 'guest-moments.js';
      script.defer = true;
      script.dataset.guestMomentsScript = 'true';
      document.body.appendChild(script);
    }
  }
})();
