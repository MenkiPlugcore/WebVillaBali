(() => {
 const endpoint='https://tvcmwkzwemrwwewphfgh.supabase.co/functions/v1/public-catalog?kind=settings';
 let settings={contact:{},social_links:{}};
 const language=()=>localStorage.getItem('aup-language')==='id'?'id':'en';
 const socials={
  instagram:{label:'Instagram',hosts:['instagram.com','www.instagram.com'],icon:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>'},
  facebook:{label:'Facebook',hosts:['facebook.com','www.facebook.com','m.facebook.com'],icon:'<path d="M15 21v-8h3l.5-4H15V7c0-1.1.4-2 2-2h2V1.5A25 25 0 0 0 16 1c-3 0-5 1.8-5 5v3H8v4h3v8"/>'},
  youtube:{label:'YouTube',hosts:['youtube.com','www.youtube.com','youtu.be'],icon:'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>'},
  tiktok:{label:'TikTok',hosts:['tiktok.com','www.tiktok.com'],icon:'<path d="M14 3v12a4 4 0 1 1-4-4M14 3c0 4 3 6 6 6"/>'}
 };
 function socialEntries(){
  return Object.entries(socials).flatMap(([field,social])=>{try{const value=settings.social_links?.[field];if(typeof value!=='string'||!value.trim())return [];const url=new URL(value.trim());if(url.protocol!=='https:'||url.username||url.password||url.port||!social.hosts.includes(url.hostname))return [];return [{...social,url:url.href}];}catch{return [];}});
 }
 function render(){
  const c=settings.contact||{},id=language()==='id';
  document.querySelectorAll('[data-policy-links]').forEach(el=>{
   el.replaceChildren();el.setAttribute('aria-label',id?'Kebijakan website':'Website policies');
   for(const [path,label]of [['privacy',id?'Privasi':'Privacy'],['terms',id?'Ketentuan':'Terms'],['cancellation',id?'Pembatalan & refund':'Cancellations & refunds']]){const a=document.createElement('a');a.href='/'+path;a.textContent=label;el.appendChild(a);}
  });
  document.querySelectorAll('[data-public-contact]').forEach(el=>{
   el.style.overflowWrap='anywhere';el.replaceChildren();
   for(const field of ['address','email','phone','whatsapp']){const value=c[field];if(!value)continue;const p=document.createElement('p');if(field==='address'){p.textContent=value;}else{const a=document.createElement('a');a.textContent=field==='whatsapp'?'WhatsApp: +'+value:value;a.href=field==='email'?'mailto:'+value:field==='phone'?'tel:'+value:'https://wa.me/'+value;if(field==='whatsapp'){a.target='_blank';a.rel='noopener noreferrer';}p.appendChild(a);}el.appendChild(p);}
   if(!el.children.length){const a=document.createElement('a');a.href='/index.html#contact';a.textContent=id?'Hubungi melalui tiket':'Contact via inquiry ticket';el.appendChild(a);}
  });
  const entries=socialEntries(),footer=document.querySelector('footer');
  if(entries.length&&footer&&!footer.querySelector('[data-public-socials]')){const nav=document.createElement('nav');nav.className='shell public-socials public-socials-footer';nav.dataset.publicSocials='';const anchor=footer.querySelector('[data-policy-links]');if(anchor)anchor.before(nav);else footer.appendChild(nav);}
  document.querySelectorAll('[data-public-socials]').forEach(el=>{
   el.classList.add('public-socials');el.replaceChildren();el.hidden=entries.length===0;el.setAttribute('aria-label',id?'Media sosial Agung Ubud Property':'Agung Ubud Property social media');
   for(const social of entries){const a=document.createElement('a');a.className='public-social-link';a.href=social.url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',social.label+' · Agung Ubud Property'+(id?' (tab baru)':' (opens in a new tab)'));a.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+social.icon+'</svg>';const label=document.createElement('span');label.textContent=social.label;a.appendChild(label);el.appendChild(a);}
  });
 }
 async function load(){try{const response=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('LOAD_FAILED');const result=await response.json();if(!result.settings||typeof result.settings!=='object')throw Error('LOAD_FAILED');settings=result.settings;window.AUP_PUBLIC_SETTINGS={...settings.contact};render();document.dispatchEvent(new CustomEvent('aup:settings-loaded'));}catch{render();}}
 for(const id of ['languageToggle','rentalLanguage','guestLanguage','compareLanguage','policyLanguage'])document.getElementById(id)?.addEventListener('click',()=>setTimeout(render,0));render();load();
})();
