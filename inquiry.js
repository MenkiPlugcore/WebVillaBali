(() => {
 const endpoint='https://tvcmwkzwemrwwewphfgh.supabase.co/functions/v1/public-inquiry';
 const language=()=>localStorage.getItem('aup-language')==='id'?'id':'en';
 const channels=new WeakMap();
 const channelCopy={
  id:{title:'Pilih cara menghubungi kami',whatsapp:'Chat WhatsApp',ticket:'Formulir tiket',note:'Chat langsung dengan tim, atau kirim pertanyaan melalui tiket.',unavailable:'WhatsApp belum tersedia. Silakan gunakan formulir tiket.',message:'Halo Agung Ubud Property, saya ingin bertanya',general:'tentang properti dan layanan di Bali'},
  en:{title:'How would you like to get in touch?',whatsapp:'Chat on WhatsApp',ticket:'Inquiry form',note:'Chat with our team, or send your questions as an inquiry ticket.',unavailable:'WhatsApp is currently unavailable. Please use the inquiry form.',message:'Hello Agung Ubud Property, I would like to ask',general:'about properties and services in Bali'}
 };
 function businessNumber(){
  const value=String(window.AUP_PUBLIC_SETTINGS?.whatsapp||'').trim();
  if(!/^[+\d\s().-]+$/.test(value))return '';
  let number=value.replace(/\D/g,'');if(number.startsWith('00'))number=number.slice(2);if(number.startsWith('0'))number='62'+number.slice(1);
  return /^[1-9]\d{6,14}$/.test(number)?number:'';
 }
 function refresh(form){
  const forms=form?[form]:document.querySelectorAll('[data-inquiry-bound]');
  forms.forEach(form=>channels.get(form)?.render());
 }
 function addChannels(form,context){
  const body=document.createElement('div');body.className='inquiry-ticket-fields';body.id=(form.id||'aup-inquiry')+'-ticket-fields';
  Array.from(form.childNodes).forEach(node=>body.appendChild(node));
  const panel=document.createElement('div');panel.className='inquiry-channels';
  panel.innerHTML='<p class="inquiry-channel-title"></p><div class="inquiry-channel-actions"><a class="inquiry-channel inquiry-whatsapp" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.02 4.8A11.14 11.14 0 0 0 6.5 21.7L5 27.2l5.62-1.47A11.17 11.17 0 1 0 16.02 4.8Zm0 20.3a9.23 9.23 0 0 1-4.7-1.28l-.34-.2-3.34.88.9-3.25-.22-.34a9.25 9.25 0 1 1 7.7 4.19Zm5.08-6.92c-.28-.14-1.65-.81-1.9-.9-.26-.1-.45-.14-.64.14-.19.28-.73.9-.9 1.09-.16.19-.33.21-.61.07-.28-.14-1.18-.43-2.25-1.39a8.43 8.43 0 0 1-1.55-1.93c-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.03 2.81 1.17 3c.14.19 2.02 3.09 4.9 4.33.68.3 1.22.47 1.64.6.69.22 1.31.19 1.8.12.55-.08 1.65-.68 1.88-1.33.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33Z"/></svg><span></span></a><button class="inquiry-channel inquiry-ticket-toggle" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 3h7l4 4v14H6V3zM14 3v5h4M9 12h6M9 16h6"/></svg><span></span><span class="inquiry-channel-chevron" aria-hidden="true">⌄</span></button></div><p class="inquiry-channel-note"></p>';
  form.appendChild(panel);form.appendChild(body);
  const link=panel.querySelector('.inquiry-whatsapp'),toggle=panel.querySelector('button');
  toggle.setAttribute('aria-controls',body.id);
  let ticketOpen=form.dataset.inquiryTicketOpen===undefined?null:form.dataset.inquiryTicketOpen==='true';
  function render(){
   const c=channelCopy[language()],number=businessNumber(),busy=form.getAttribute('aria-busy')==='true';
   const open=ticketOpen===null?!number:ticketOpen;
   body.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.disabled=busy;
   panel.querySelector('.inquiry-channel-title').textContent=c.title;link.querySelector('span').textContent=c.whatsapp;toggle.querySelector('span').textContent=c.ticket;
   panel.querySelector('.inquiry-channel-note').textContent=number?c.note:c.unavailable;
   if(number&&!busy){
    let topic='';try{topic=String(context?.()||'').trim().slice(0,600);}catch{}
    const page=String(window.location?.href||'').split('#')[0].slice(0,1200);
    link.setAttribute('href','https://wa.me/'+number+'?text='+encodeURIComponent(c.message+' '+(topic||c.general)+'.'+(page?'\n'+page:'')));link.removeAttribute('aria-disabled');link.removeAttribute('tabindex');
   }else{link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.setAttribute('tabindex','-1');}
  }
  toggle.addEventListener('click',()=>{
   if(toggle.disabled)return;ticketOpen=body.hidden;form.dataset.inquiryTicketOpen=String(ticketOpen);render();
   if(ticketOpen)body.querySelector('input:not([type=hidden]),select,textarea')?.focus({preventScroll:true});
  });
  link.addEventListener('click',event=>{render();if(!link.getAttribute('href'))event.preventDefault();});
  form.addEventListener('input',event=>{if(body.contains(event.target)){ticketOpen=true;form.dataset.inquiryTicketOpen='true';}render();});
  form.addEventListener('change',render);
  channels.set(form,{render});render();
 }
 const copy={id:{busy:'Mengirim…',success:'Tiket berhasil dibuat. Tim akan menghubungimu lewat kontak yang kamu isi.',error:'Pesan belum terkirim. Periksa koneksi dan coba lagi; isianmu tetap tersimpan.',invalid:'Periksa nama, kontak, pesan, dan tanggal rental.',limit:'Terlalu banyak pesan. Tunggu beberapa menit sebelum mencoba lagi.',gone:'Listing sudah tidak tersedia. Pilih listing lain.',conflict:'Isian berubah. Silakan coba kirim lagi.'},en:{busy:'Sending…',success:'Your ticket was created. The team will contact you using the details you provided.',error:'Your inquiry was not sent. Check your connection and try again; your details are still here.',invalid:'Check your name, contact details, message, and rental date.',limit:'Too many inquiries. Please wait a few minutes before trying again.',gone:'This listing is no longer available. Please choose another.',conflict:'Your details changed. Please try sending again.'}};
 function bind(form,extra=()=>({}),onSuccess=()=>{},options={}){
  if(!form||form.dataset.inquiryBound)return;form.dataset.inquiryBound='true';
  addChannels(form,options.context);
  let started=Date.now(),pending=false,lastPayload='',requestId='';
  const trap=document.createElement('div');trap.className='inquiry-honeypot';trap.setAttribute('aria-hidden','true');trap.innerHTML='<label>Website<input name="website" type="text" autocomplete="off" tabindex="-1"></label>';form.appendChild(trap);
  const status=document.createElement('p');status.className='inquiry-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.appendChild(status);
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(pending)return;if(form.reportValidity&&!form.reportValidity())return;
   const c=copy[language()],button=form.querySelector('[type=submit]'),label=button.textContent;let preferences=[];
   try{
    const fields=new FormData(form),data={name:String(fields.get('name')||'').trim(),email:String(fields.get('email')||'').trim(),phone:String(fields.get('phone')||'').trim(),message:String(fields.get('message')||'').trim(),language:language(),inquiry_type:'general',...extra(fields),website:fields.get('website')||''};
    const serialized=JSON.stringify(data);if(serialized!==lastPayload){requestId=crypto.randomUUID();lastPayload=serialized;}
    pending=true;button.disabled=true;button.textContent=c.busy;form.setAttribute('aria-busy','true');status.textContent=c.busy;status.classList.remove('is-error');
    refresh(form);
    preferences=Array.from(document.querySelectorAll('#languageToggle,#rentalLanguage,#currencyToggle,#rentalCurrency')).concat(Array.from(form.querySelectorAll('input,textarea,select'))).map(el=>({el,disabled:el.disabled}));preferences.forEach(({el})=>el.disabled=true);
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,request_id:requestId,started_at:started}),signal:AbortSignal.timeout(30000)});
    const result=await response.json();if(response.status===409)lastPayload='';if(!response.ok||result.success!==true||!/^AUP-[0-9]+$/.test(result.ticket_no||'')){const error=Error(response.status===429?c.limit:response.status===404?c.gone:response.status===409?c.conflict:response.status===400?c.invalid:c.error);throw error;}
    form.reset();lastPayload='';requestId='';started=Date.now();status.textContent=(language()==='id'?'Nomor tiket: ':'Ticket number: ')+result.ticket_no+'. '+c.success;try{onSuccess();}catch{console.warn('Inquiry success callback failed');}
   }catch(error){status.textContent=error.message&&Object.values(c).includes(error.message)?error.message:c.error;status.classList.add('is-error');}
   finally{pending=false;button.disabled=false;button.textContent=label;form.setAttribute('aria-busy','false');preferences.forEach(({el,disabled})=>el.disabled=disabled);refresh(form);}
  });
 }
 document.addEventListener('aup:settings-loaded',()=>refresh());
 for(const id of ['languageToggle','rentalLanguage'])document.getElementById(id)?.addEventListener('click',()=>Promise.resolve().then(()=>refresh()));
 window.AUPInquiry={bind,refresh};
})();

