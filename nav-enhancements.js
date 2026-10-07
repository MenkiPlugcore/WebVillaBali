(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  requestAnimationFrame(() => header.classList.add('nav-mounted'));

  const syncHeader = () => {
    const scrolled = window.scrollY > 24;
    header.classList.toggle('nav-scrolled', scrolled);
  };

  const ensureHeaderPolishStyle = () => {
    if (document.querySelector('link[data-mobile-header-polish]')) return;
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = document.body.classList.contains('property-page') ? '../mobile-header-polish.css?v=20261007-transparent-nav-4' : 'mobile-header-polish.css?v=20261007-transparent-nav-4';
    style.dataset.mobileHeaderPolish = 'true';
    document.head.appendChild(style);
  };

  const ensureFinalBrandLogoStyle = () => {
    if (document.querySelector('link[data-final-brand-logo]')) return;
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = document.body.classList.contains('property-page') ? '../final-brand-logo.css' : 'final-brand-logo.css';
    style.dataset.finalBrandLogo = 'true';
    document.head.appendChild(style);
  };

  const ensureLogoOverflowFixStyle = () => {
    if (document.querySelector('link[data-logo-overflow-fix]')) return;
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = document.body.classList.contains('property-page') ? '../logo-overflow-fix.css' : 'logo-overflow-fix.css';
    style.dataset.logoOverflowFix = 'true';
    document.head.appendChild(style);
  };

  const syncEmptyBadges = () => {
    header.querySelectorAll('.saved-count,.compare-count').forEach(badge => {
      badge.hidden = Number(badge.textContent.trim()) === 0;
    });
  };
  new MutationObserver(syncEmptyBadges).observe(header, { childList: true, subtree: true, characterData: true });
  syncEmptyBadges();

  const syncCompactUtilities = () => {
    const languageButton = header.querySelector('#languageToggle');
    const currencyButton = header.querySelector('#currencyToggle');
    const language = (localStorage.getItem('aup-language') || 'en').toUpperCase();
    const currency = (localStorage.getItem('aup-currency') || 'USD').toUpperCase();

    if (languageButton) {
      languageButton.dataset.navShort = language;
      languageButton.setAttribute('translate', 'no');
      languageButton.classList.add('notranslate');
      languageButton.setAttribute('aria-label', language === 'ID' ? 'Ganti bahasa' : 'Change language');
    }

    if (currencyButton) {
      currencyButton.dataset.navShort = currency;
      currencyButton.setAttribute('translate', 'no');
      currencyButton.classList.add('notranslate');
      currencyButton.setAttribute('aria-label', language === 'ID' ? 'Ganti mata uang' : 'Change currency');
    }

    header.querySelectorAll('.saved-nav-link,.compare-nav-link,.saved-count,.compare-count,.saved-nav-heart,.compare-nav-icon').forEach(el => {
      el.setAttribute('translate', 'no');
      el.classList.add('notranslate');
    });
  };

  const scheduleUtilitySync = () => requestAnimationFrame(syncCompactUtilities);

  ensureHeaderPolishStyle();
  ensureFinalBrandLogoStyle();
  ensureLogoOverflowFixStyle();
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
  window.addEventListener('storage', scheduleUtilitySync);

  header.addEventListener('click', event => {
    if (event.target.closest('#languageToggle,#currencyToggle')) setTimeout(syncCompactUtilities, 0);
  });

  // Homepage guest documentation concept preview. The dedicated gallery page
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

  function loadBuildServices(){
    if(!document.getElementById('services')) return;
    if(!document.querySelector('link[data-build-services-style]')){
      const style=document.createElement('link');
      style.rel='stylesheet';
      style.href='build-services.css';
      style.dataset.buildServicesStyle='true';
      document.head.appendChild(style);
    }
    if(!document.querySelector('script[data-build-services-script]')){
      const script=document.createElement('script');
      script.src='build-services.js';
      script.dataset.buildServicesScript='true';
      document.body.appendChild(script);
    }
  }

  // Load the latest client requested homepage refinements after the core page
  // scripts have finished parsing. This keeps location filtering connected to
  // the existing catalog state without duplicating the catalog engine.
  if (document.getElementById('properties')) {
    if (!document.querySelector('link[data-client-feedback-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'client-feedback.css?v=20261007-transparent-nav-4';
      style.dataset.clientFeedbackStyle = 'true';
      document.head.appendChild(style);
    }
    window.addEventListener('DOMContentLoaded', () => {
      scheduleUtilitySync();
      if (document.querySelector('script[data-client-feedback-script]')) {
        loadBuildServices();
        return;
      }
      const script = document.createElement('script');
      script.src = 'client-feedback.js?v=20261007-transparent-nav-4';
      script.dataset.clientFeedbackScript = 'true';
      script.addEventListener('load', () => {
        scheduleUtilitySync();
        loadBuildServices();
      }, { once: true });
      document.body.appendChild(script);
    }, { once: true });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleUtilitySync, { once: true });
  } else {
    scheduleUtilitySync();
  }
})();
