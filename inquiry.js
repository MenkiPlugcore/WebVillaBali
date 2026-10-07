(() => {
 const endpoint='https://tvcmwkzwemrwwewphfgh.supabase.co/functions/v1/public-inquiry';
 const language=()=>localStorage.getItem('aup-language')==='id'?'id':'en';
 const copy={id:{busy:'Mengirim…',success:'Tiket berhasil dibuat. Tim akan menghubungimu lewat kontak yang kamu isi.',error:'Pesan belum terkirim. Periksa koneksi dan coba lagi; isianmu tetap tersimpan.',invalid:'Periksa nama, kontak, pesan, dan tanggal rental.',limit:'Terlalu banyak pesan. Tunggu beberapa menit sebelum mencoba lagi.',gone:'Listing sudah tidak tersedia. Pilih listing lain.',conflict:'Isian berubah. Silakan coba kirim lagi.'},en:{busy:'Sending…',success:'Your ticket was created. The team will contact you using the details you provided.',error:'Your inquiry was not sent. Check your connection and try again; your details are still here.',invalid:'Check your name, contact details, message, and rental date.',limit:'Too many inquiries. Please wait a few minutes before trying again.',gone:'This listing is no longer available. Please choose another.',conflict:'Your details changed. Please try sending again.'}};
 function bind(form,extra=()=>({}),onSuccess=()=>{}){
  if(!form||form.dataset.inquiryBound)return;form.dataset.inquiryBound='true';
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
    preferences=Array.from(document.querySelectorAll('#languageToggle,#rentalLanguage,#currencyToggle,#rentalCurrency')).concat(Array.from(form.querySelectorAll('input,textarea,select'))).map(el=>({el,disabled:el.disabled}));preferences.forEach(({el})=>el.disabled=true);
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,request_id:requestId,started_at:started}),signal:AbortSignal.timeout(30000)});
    const result=await response.json();if(response.status===409)lastPayload='';if(!response.ok||result.success!==true||!/^AUP-[0-9]+$/.test(result.ticket_no||'')){const error=Error(response.status===429?c.limit:response.status===404?c.gone:response.status===409?c.conflict:response.status===400?c.invalid:c.error);throw error;}
    form.reset();lastPayload='';requestId='';started=Date.now();status.textContent=(language()==='id'?'Nomor tiket: ':'Ticket number: ')+result.ticket_no+'. '+c.success;onSuccess();
   }catch(error){status.textContent=error.message&&Object.values(c).includes(error.message)?error.message:c.error;status.classList.add('is-error');}
   finally{pending=false;button.disabled=false;button.textContent=label;form.setAttribute('aria-busy','false');preferences.forEach(({el,disabled})=>el.disabled=disabled);}
  });
 }
 window.AUPInquiry={bind};
})();
