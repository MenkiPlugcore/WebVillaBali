    document.getElementById('languageToggle')?.addEventListener('click',()=>{
      const next=(localStorage.getItem('aup-language')||'en')==='en'?'id':'en';
      localStorage.setItem('aup-language',next);
    });
    document.getElementById('currencyToggle')?.addEventListener('click',()=>{
      const next=(localStorage.getItem('aup-currency')||'USD')==='USD'?'IDR':'USD';
      localStorage.setItem('aup-currency',next);
    });
