(() => {
  const moments=[
    {src:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=86",place:"Ubud",shape:"wide"},
    {src:"https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=86",place:"Canggu",shape:"tall"},
    {src:"https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=1200&q=86",place:"Sanur",shape:""},
    {src:"https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1000&q=86",place:"Ubud",shape:"tall"},
    {src:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=86",place:"Canggu",shape:"wide"},
    {src:"https://images.unsplash.com/photo-1504151932400-72d4384f04b3?auto=format&fit=crop&w=1000&q=86",place:"Seminyak",shape:""},
    {src:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=86",place:"Bali",shape:"wide"},
    {src:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=86",place:"Ubud",shape:"tall"},
    {src:"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=86",place:"Bali",shape:""},
    {src:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=86",place:"Canggu",shape:"tall"}
  ];
  const copy={
    en:{eyebrow:"Guest documentation",title:"Moments with our guests.",intro:"A dedicated space for real moments, arrivals, visits, and memories shared with guests. designed to feel personal without overwhelming the property experience.",note:"Concept preview · sample imagery",view:"View all moments",foot:"Replace the sample images with approved guest documentation before public launch.",caption:"Guest moment",back:"← Back to home",pageTitle:"Guest moments & memories",pageIntro:"A visual archive for documentation with guests, visits, and meaningful moments around Agung Ubud Property.",galleryTitle:"A closer look at the moments.",galleryCopy:"This preview uses sample imagery only. Production can use the owner's real documentation once each photo is approved for publication."},
    id:{eyebrow:"Dokumentasi tamu",title:"Momen bersama para tamu.",intro:"Ruang khusus untuk dokumentasi kedatangan, kunjungan, dan momen bersama tamu. dibuat personal tanpa mengganggu pengalaman utama pencarian properti.",note:"Pratinjau konsep · gambar contoh",view:"Lihat semua momen",foot:"Ganti gambar contoh dengan dokumentasi tamu yang sudah mendapat izin sebelum peluncuran publik.",caption:"Momen tamu",back:"← Kembali ke beranda",pageTitle:"Momen & dokumentasi tamu",pageIntro:"Arsip visual untuk dokumentasi bersama tamu, kunjungan, dan momen bermakna di Agung Ubud Property.",galleryTitle:"Lihat momen lebih dekat.",galleryCopy:"Pratinjau ini hanya menggunakan gambar contoh. Versi produksi dapat memakai dokumentasi asli owner setelah setiap foto disetujui untuk dipublikasikan."}
  };
  const language=()=>localStorage.getItem("aup-language")||"en";
  const t=()=>copy[language()]||copy.en;

  function cardMarkup(item){
    const c=t();
    return `<button class="guest-moment-card ${item.shape||""}" type="button" data-gm-src="${item.src}" data-gm-place="${item.place}" aria-label="${c.caption} · ${item.place}"><img src="${item.src}" alt="${c.caption} · ${item.place}" loading="lazy"><span class="guest-moment-caption"><strong>${item.place}</strong><small>${c.caption}</small></span></button>`;
  }
  function homepageSection(){
    if(document.body.classList.contains("guest-moments-page")||document.getElementById("guestMoments"))return;
    const anchor=document.getElementById("reviews")||document.getElementById("about");if(!anchor)return;
    const c=t();const section=document.createElement("section");section.className="guest-moments-section";section.id="guestMoments";
    const first=[...moments.slice(0,6),...moments.slice(0,6)].map(cardMarkup).join("");
    const second=[...moments.slice(4,10),...moments.slice(4,10)].map(cardMarkup).join("");
    section.innerHTML=`<div class="shell guest-moments-head"><div><p class="eyebrow light">${c.eyebrow}</p><h2>${c.title}</h2></div><div class="guest-moments-copy"><p>${c.intro}</p><span class="guest-moments-note">${c.note}</span></div></div><div class="guest-moments-marquee"><div class="guest-moments-track">${first}</div></div><div class="guest-moments-marquee"><div class="guest-moments-track reverse">${second}</div></div><div class="shell guest-moments-actions"><p>${c.foot}</p><a class="guest-moments-link" href="guest-moments.html">${c.view} →</a></div>`;
    anchor.insertAdjacentElement("beforebegin",section);bindOpeners(section)
  }
  function refreshHomepage(){const old=document.getElementById("guestMoments");if(old)old.remove();homepageSection()}

  function ensureLightbox(){
    let box=document.querySelector(".gm-lightbox");if(box)return box;
    box=document.createElement("div");box.className="gm-lightbox";box.innerHTML='<button type="button" aria-label="Close">×</button><img alt=""><div class="gm-lightbox-caption"></div>';document.body.appendChild(box);
    const close=()=>box.classList.remove("open");box.querySelector("button").addEventListener("click",close);box.addEventListener("click",e=>{if(e.target===box)close()});document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});return box
  }
  function openLightbox(src,place){const box=ensureLightbox();const img=box.querySelector("img");img.src=src;img.alt=`${t().caption} · ${place}`;box.querySelector(".gm-lightbox-caption").textContent=`${place} · ${t().caption}`;box.classList.add("open")}
  function bindOpeners(root=document){root.querySelectorAll?.("[data-gm-src]").forEach(btn=>{if(btn.dataset.gmBound)return;btn.dataset.gmBound="1";btn.addEventListener("click",()=>openLightbox(btn.dataset.gmSrc,btn.dataset.gmPlace||"Bali"))})}

  function renderPage(){
    if(!document.body.classList.contains("guest-moments-page"))return;
    const c=t();document.documentElement.lang=language();
    document.querySelectorAll("[data-gm-copy]").forEach(el=>{const key=el.dataset.gmCopy;if(c[key])el.textContent=c[key]});
    const langBtn=document.getElementById("guestLanguage");if(langBtn)langBtn.textContent=language().toUpperCase();
    const grid=document.getElementById("guestMomentsGrid");if(grid){grid.innerHTML=moments.map((m,i)=>`<button class="gm-tile" type="button" data-gm-src="${m.src}" data-gm-place="${m.place}"><img src="${m.src}" alt="${c.caption} · ${m.place}" loading="lazy"><span>${m.place} · ${c.caption}</span></button>`).join("");bindOpeners(grid)}
  }
  function bindPage(){
    const lang=document.getElementById("guestLanguage");lang?.addEventListener("click",()=>{const next=language()==="en"?"id":"en";localStorage.setItem("aup-language",next);renderPage()});
    const menuBtn=document.getElementById("guestMenuButton"),menu=document.getElementById("guestMobileMenu");menuBtn?.addEventListener("click",()=>{const open=menuBtn.getAttribute("aria-expanded")==="true";menuBtn.setAttribute("aria-expanded",String(!open));menu?.classList.toggle("open",!open)});
    menu?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{menu.classList.remove("open");menuBtn?.setAttribute("aria-expanded","false")}));
  }

  if(document.body.classList.contains("guest-moments-page")){renderPage();bindPage()}else{homepageSection();document.getElementById("languageToggle")?.addEventListener("click",()=>setTimeout(refreshHomepage,0));}
})();
