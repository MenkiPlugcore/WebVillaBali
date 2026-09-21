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
})();
