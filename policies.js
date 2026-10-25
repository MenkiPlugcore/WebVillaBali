(() => {
  const button = document.getElementById('policyLanguage');
  const labels = { en: { privacy: 'Privacy policy', terms: 'Website & booking terms', cancellation: 'Cancellations & refunds', contact: 'Contact our team' }, id: { privacy: 'Kebijakan privasi', terms: 'Ketentuan situs & pemesanan', cancellation: 'Pembatalan & refund', contact: 'Hubungi tim' } };
  let language = 'en';
  try { language = localStorage.getItem('aup-language') === 'id' ? 'id' : 'en'; } catch {}
  function render() {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-policy-lang]').forEach(el => { el.hidden = el.dataset.policyLang !== language; });
    document.querySelectorAll('[data-policy-nav]').forEach(el => { el.textContent = labels[language][el.dataset.policyNav]; });
    document.querySelector('[data-policy-contact-link]').textContent = labels[language].contact;
    document.title = labels[language][document.body.dataset.policy] + ' | Agung Ubud Property';
    const intro = document.querySelector('[data-policy-lang="' + language + '"] .policy-hero p:not(.eyebrow)').textContent.slice(0,160);
    for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])document.querySelector(selector)?.setAttribute('content',intro);
    const structured=document.getElementById('siteStructuredData');
    if(structured){try{const data=JSON.parse(structured.textContent);data.name=document.title;data.description=intro;data.inLanguage=language;structured.textContent=JSON.stringify(data);}catch{}}
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', document.title);
    button.textContent = language.toUpperCase();
    button.setAttribute('aria-label', language === 'id' ? 'Ganti ke Bahasa Inggris' : 'Switch to Indonesian');
  }
  button?.addEventListener('click', () => { language = language === 'en' ? 'id' : 'en'; try { localStorage.setItem('aup-language', language); } catch {} render(); });
  render();
})();
