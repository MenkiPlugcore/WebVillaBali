(() => {
 const endpoint='https://tvcmwkzwemrwwewphfgh.supabase.co/functions/v1/public-catalog?kind=settings';
 let settings={contact:{},social_links:{}};
 const language=()=>localStorage.getItem('aup-language')==='id'?'id':'en';
 function render(){
  const c=settings.contact||{},id=language()==='id';
  document.querySelectorAll('[data-public-contact]').forEach(el=>{
   el.style.overflowWrap='anywhere';el.replaceChildren();
   for(const field of ['address','email','phone','whatsapp']){const value=c[field];if(!value)continue;const p=document.createElement('p');if(field==='address'){p.textContent=value;}else{const a=document.createElement('a');a.textContent=field==='whatsapp'?'WhatsApp: +'+value:value;a.href=field==='email'?'mailto:'+value:field==='phone'?'tel:'+value:'https://wa.me/'+value;if(field==='whatsapp'){a.target='_blank';a.rel='noopener noreferrer';}p.appendChild(a);}el.appendChild(p);}
   if(!el.children.length){const a=document.createElement('a');a.href='/index.html#contact';a.textContent=id?'Hubungi melalui tiket':'Contact via inquiry ticket';el.appendChild(a);}
  });
  document.querySelectorAll('[data-public-socials]').forEach(el=>{el.replaceChildren();for(const [field,url]of Object.entries(settings.social_links||{})){const a=document.createElement('a');a.textContent=field==='youtube'?'YouTube':field==='tiktok'?'TikTok':field[0].toUpperCase()+field.slice(1);a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.style.marginRight='14px';el.appendChild(a);}});
 }
 async function load(){try{const response=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('LOAD_FAILED');const result=await response.json();if(!result.settings||typeof result.settings!=='object')throw Error('LOAD_FAILED');settings=result.settings;window.AUP_PUBLIC_SETTINGS={...settings.contact};render();document.dispatchEvent(new CustomEvent('aup:settings-loaded'));}catch{render();}}
 document.getElementById('languageToggle')?.addEventListener('click',()=>setTimeout(render,0));document.getElementById('rentalLanguage')?.addEventListener('click',()=>setTimeout(render,0));render();load();
})();
