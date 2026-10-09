(() => {
  const endpoint='https://tvcmwkzwemrwwewphfgh.supabase.co/functions/v1/public-catalog';
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dedicated=document.body.classList.contains('guest-moments-page');
  const copy={
    en:{eyebrow:'Guest documentation',title:'Moments with our guests.',intro:'Arrivals, visits, and memories shared with our guests.',note:'Shared with permission',view:'View all moments',foot:'A glimpse of the people and moments behind Agung Ubud Property.',caption:'Guest moment',back:'← Back to home',pageTitle:'Guest moments & memories',pageIntro:'A visual archive of visits and meaningful moments at Agung Ubud Property.',galleryTitle:'A closer look at the moments.',galleryCopy:'Guest documentation selected by our team and shared with permission.',empty:'Guest moments coming soon.',loading:'Loading guest moments…',error:'Guest moments could not be loaded.',retry:'Try again',more:'Show more moments',close:'Close photo',photoError:'Photo could not be loaded.'},
    id:{eyebrow:'Dokumentasi tamu',title:'Momen bersama para tamu.',intro:'Dokumentasi kedatangan, kunjungan, dan kenangan bersama para tamu.',note:'Dibagikan dengan izin',view:'Lihat semua momen',foot:'Cerita kecil dari orang-orang dan momen di Agung Ubud Property.',caption:'Momen tamu',back:'← Kembali ke beranda',pageTitle:'Momen & dokumentasi tamu',pageIntro:'Arsip visual kunjungan dan momen bermakna di Agung Ubud Property.',galleryTitle:'Lihat momen lebih dekat.',galleryCopy:'Dokumentasi pilihan tim yang telah mendapat izin publikasi.',empty:'Dokumentasi tamu segera hadir.',loading:'Memuat dokumentasi tamu…',error:'Dokumentasi tamu belum bisa dimuat.',retry:'Coba lagi',more:'Lihat momen lainnya',close:'Tutup foto',photoError:'Foto belum bisa dimuat.'}
  };
  const language=()=>localStorage.getItem('aup-language')==='id'?'id':'en';
  const t=()=>copy[language()];
  const caption=item=>item['caption_'+language()]||item.caption_en||item.caption_id||t().caption;
  const image=(id,fresh=false)=>endpoint+'?kind=guest&image='+encodeURIComponent(id)+(fresh?'&v='+Date.now():'');
  let moments=[],page=0,hasMore=false,busy=false,failed=false,opener;
  function card(item){const label=caption(item),place=item.location_label||'';return `<button class="${dedicated?'gm-tile':'guest-moment-card'}" type="button" data-gm-id="${escape(item.id)}" aria-label="${escape([label,place].filter(Boolean).join(' · '))}"><img src="${image(item.id)}" alt="${escape(label)}" loading="lazy"><span class="guest-moment-caption"><strong>${escape(place)}</strong><small>${escape(label)}</small></span></button>`;}
  function state(){const c=t();return `<div class="gm-state" role="status"><p>${escape(busy?c.loading:failed?c.error:c.empty)}</p>${failed&&!busy?`<button type="button" data-gm-retry>${c.retry}</button>`:''}</div>`;}
  function homepage(){
    let section=document.getElementById('guestMoments');
    if(!section){const anchor=document.getElementById('reviews')||document.getElementById('about');if(!anchor)return;section=document.createElement('section');section.id='guestMoments';section.className='guest-moments-section';anchor.insertAdjacentElement('beforebegin',section);}
    const c=t();section.innerHTML=`<div class="shell"><div class="guest-moments-head"><div><p class="eyebrow light">${c.eyebrow}</p><h2>${c.title}</h2></div><div class="guest-moments-copy"><p>${c.intro}</p><span class="guest-moments-note">${c.note}</span></div></div><div class="gm-home-grid">${moments.length?moments.slice(0,6).map(card).join(''):state()}</div><div class="guest-moments-actions"><p>${c.foot}</p><a class="guest-moments-link" href="guest-moments.html">${c.view} →</a></div></div>`;bind(section);
  }
  function render(){
    if(!dedicated){homepage();return;}
    const c=t();document.documentElement.lang=language();document.querySelectorAll('[data-gm-copy]').forEach(el=>{if(c[el.dataset.gmCopy])el.textContent=c[el.dataset.gmCopy];});
    const lang=document.getElementById('guestLanguage');if(lang)lang.textContent=language().toUpperCase();
    const grid=document.getElementById('guestMomentsGrid');if(grid){grid.innerHTML=moments.length?moments.map(card).join(''):state();grid.classList.toggle('gm-gallery-empty',!moments.length);bind(grid);}
    let actions=document.getElementById('gmGalleryActions');if(!actions&&grid){actions=document.createElement('div');actions.id='gmGalleryActions';actions.className='gm-gallery-actions';grid.insertAdjacentElement('afterend',actions);}
    if(actions){actions.innerHTML=moments.length&&hasMore?`<button type="button" data-gm-more ${busy?'disabled':''}>${busy?c.loading:failed?c.retry:c.more}</button>${failed?`<p role="status">${c.error}</p>`:''}`:'';actions.querySelector('[data-gm-more]')?.addEventListener('click',()=>load(true));}
  }
  async function load(next=false){
    if(busy)return;busy=true;failed=false;render();
    try{const current=next?page+1:0;const res=await fetch(endpoint+'?kind=guest&page='+current,{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error('LOAD');const data=await res.json();if(!Array.isArray(data.moments))throw Error('LOAD');const valid=data.moments.filter(m=>uuid.test(m.id));moments=next?[...moments,...valid.filter(m=>!moments.some(old=>old.id===m.id))]:valid;page=current;hasMore=data.hasMore===true;}catch{failed=true;}finally{busy=false;render();}
  }
  function close(){const box=document.querySelector('.gm-lightbox');box?.classList.remove('open');if(box){box.hidden=true;box.querySelector('img').removeAttribute('src');}document.body.classList.remove('gm-modal-open');opener?.focus();}
  function lightbox(){
    let box=document.querySelector('.gm-lightbox');if(box)return box;
    box=document.createElement('div');box.className='gm-lightbox';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.innerHTML='<button type="button">×</button><img alt=""><div class="gm-lightbox-caption" id="gmLightboxCaption"></div>';box.setAttribute('aria-labelledby','gmLightboxCaption');document.body.appendChild(box);
    box.querySelector('button').addEventListener('click',close);box.addEventListener('click',e=>{if(e.target===box)close();});box.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){e.preventDefault();box.querySelector('button').focus();}});box.querySelector('img').addEventListener('error',()=>{box.querySelector('.gm-lightbox-caption').textContent=t().photoError;});return box;
  }
  function bind(root){
    root.querySelector('[data-gm-retry]')?.addEventListener('click',()=>load());
    root.querySelectorAll('[data-gm-id]').forEach(button=>{button.querySelector('img').addEventListener('error',e=>{e.target.hidden=true;button.classList.add('gm-photo-error');button.querySelector('small').textContent=t().photoError;});button.addEventListener('click',()=>{const item=moments.find(m=>m.id===button.dataset.gmId);if(!item)return;opener=button;const box=lightbox(),label=[caption(item),item.location_label].filter(Boolean).join(' · ');box.querySelector('img').src=image(item.id,true);box.querySelector('img').alt=caption(item);box.querySelector('.gm-lightbox-caption').textContent=label;box.querySelector('button').setAttribute('aria-label',t().close);box.hidden=false;box.classList.add('open');document.body.classList.add('gm-modal-open');box.querySelector('button').focus();});});
  }
  if(dedicated){document.getElementById('guestLanguage')?.addEventListener('click',()=>{close();localStorage.setItem('aup-language',language()==='en'?'id':'en');render();});const button=document.getElementById('guestMenuButton'),menu=document.getElementById('guestMobileMenu');button?.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));menu?.classList.toggle('open',!open);});menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');button?.setAttribute('aria-expanded','false');}));}
  else document.getElementById('languageToggle')?.addEventListener('click',()=>setTimeout(()=>{close();render();},0));
  load();
})();
