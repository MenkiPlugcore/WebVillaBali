(() => {
 const endpoint='https://tvcmwkzwemrwwewphfgh.supabase.co/functions/v1/public-catalog?kind=site_media';
 let artwork='';
 let media={},loading=false,failed=false;
 const posterKeys=['tour_poster','driver_poster'];
 const language=()=>typeof localStorage!=='undefined'&&localStorage.getItem('aup-language')==='id'?'id':'en';
 const copy={
  en:{eyebrow:'More ways to explore',title:'Tour packages & driver services.',intro:'Explore the latest posters, then contact our team for availability and details.',tour_poster:'Tour packages',driver_poster:'Driver services',empty:'Poster coming soon.',loading:'Loading posters…',error:'Posters could not be loaded.',retry:'Try again',open:'View full poster',photoError:'Poster could not be loaded.'},
  id:{eyebrow:'Lengkapi perjalananmu',title:'Paket tour & layanan sopir.',intro:'Lihat informasi terbaru pada poster, lalu hubungi tim untuk ketersediaan dan detailnya.',tour_poster:'Paket Tour',driver_poster:'Layanan Sopir',empty:'Poster segera hadir.',loading:'Memuat poster…',error:'Poster belum bisa dimuat.',retry:'Coba lagi',open:'Lihat poster lengkap',photoError:'Poster belum bisa dimuat.'}
 };
 function version(key){const v=media[key]?.version;return typeof v==='string'&&Number.isFinite(Date.parse(v))?v:null;}
 const imageURL=(key,v)=>endpoint+'&image='+key+'&v='+encodeURIComponent(v);
 function renderPosters(){
  let section=document.getElementById('rentalPosters');
  if(!section){
   const rentalPage=document.body?.classList.contains('motor-rental-page');
   const anchor=rentalPage?document.getElementById('rentalInquiry'):document.querySelector('#livingMobility .lm-grid');
   if(!anchor)return;
   section=document.createElement('section');section.id='rentalPosters';section.className='rental-posters-section'+(rentalPage?' shell':'');section.setAttribute('aria-labelledby','rentalPostersTitle');
   anchor.insertAdjacentElement(rentalPage?'beforebegin':'afterend',section);
  }
  const c=copy[language()],state=[language(),loading,failed,...posterKeys.map(version)].join('|');
  if(section.dataset.posterState===state)return;section.dataset.posterState=state;section.setAttribute('aria-busy',String(loading));
  section.innerHTML=`<div class="rental-posters-heading"><div><p class="eyebrow dark">${c.eyebrow}</p><h2 id="rentalPostersTitle">${c.title}</h2></div><p>${c.intro}</p></div>${failed?`<p class="rental-posters-status" role="status">${c.error} <button type="button" data-poster-retry>${c.retry}</button></p>`:''}<div class="rental-posters-grid">${posterKeys.map(key=>{
   const v=version(key),label=c[key];
   return `<article class="rental-poster-card"><h3>${label}</h3>${v?`<a class="rental-poster-link" href="${imageURL(key,v)}" target="_blank" rel="noopener noreferrer" aria-label="${c.open}: ${label}"><span class="rental-poster-frame"><img src="${imageURL(key,v)}" alt="${label}" loading="lazy" decoding="async"></span><span class="rental-poster-open">${c.open} ↗</span></a>`:`<div class="rental-poster-frame rental-poster-empty" role="status"><span>${loading?c.loading:failed?c.error:c.empty}</span></div>`}</article>`;
  }).join('')}</div>`;
  section.querySelector('[data-poster-retry]')?.addEventListener('click',load);
  section.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{const frame=img.parentElement;img.hidden=true;frame.classList.add('rental-poster-empty');const message=document.createElement('span');message.textContent=c.photoError;frame.appendChild(message);}));
 }
 function render(){
  if(artwork)document.querySelectorAll('.rental-hero-media,.motor-teaser-media').forEach(el=>{el.style.backgroundImage='url("'+artwork+'")';});
  renderPosters();
 }
 document.addEventListener('aup:mobility-rendered',render);
 async function load(){
  if(loading)return;loading=true;failed=false;render();
  try{
   const response=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error('LOAD');
   const data=await response.json();if(!data.media||typeof data.media!=='object')throw Error('LOAD');media=data.media;
   const v=version('rental_hero');if(!v)return;
   const url=imageURL('rental_hero',v);
   const preload=new Image();preload.onload=()=>{artwork=url;render();};preload.src=url;
  }catch{failed=true;/* Keep the built-in image if custom artwork cannot be loaded. */}
  finally{loading=false;render();}
 }
 document.querySelectorAll('#languageToggle,#rentalLanguage').forEach(button=>button.addEventListener('click',()=>setTimeout(renderPosters,0)));
 load();
})();
