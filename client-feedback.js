(() => {
  const BRAND_LOGO_URL="https://res.cloudinary.com/dvds41ivm/image/upload/v1790170630/agung-ubud-property-logo-nav.webp";
  const language=()=>localStorage.getItem("aup-language")||"en";
  const copy={
    en:{
      locationAction:n=>`${n} listings`,
      locationLabel:n=>`View properties in ${n}`,
      waLabel:"WhatsApp",
      waFallback:"The official WhatsApp number will be connected from the business settings after the admin panel is activated.",
      waMessage:"Hello, I would like to ask about Agung Ubud Property services.",
      permitEyebrow:"Property documentation & permits",
      permitTitle:"Building permit assistance, made clearer.",
      permitText:"Get support for technical document coordination and SIMBG administration as part of the property service flow. The goal is to help owners prepare the required process more clearly and reduce avoidable administrative issues.",
      permitCta:"Ask about permits",
      permitOne:"Document coordination",
      permitOneText:"Organise the technical documents needed before the administrative process begins.",
      permitTwo:"SIMBG assistance",
      permitTwoText:"Coordinate the online building permit administration flow through the official system.",
      permitThree:"Property support",
      permitThreeText:"Keep property discovery and permit-related assistance in one service ecosystem.",
      permitNote:"Service scope and document requirements are confirmed after the property documents are reviewed.",
      permitInterest:"Building Permit / SIMBG",
      permitMessage:"Hello, I would like information about building permit and SIMBG assistance for my property.",
      heroCopy:"From private villas and long-term rentals to land and commercial opportunities. Discover properties selected for living, investing and building your next chapter.",
      trustCopy:"Premium presentation, direct inquiries, and international-ready communication help every listing feel represented with care. This includes villas, homes, land, rentals, and commercial spaces.",
      demoNote:"Demo only. No personal data is transmitted."
    },
    id:{
      locationAction:n=>`${n} properti`,
      locationLabel:n=>`Lihat properti di ${n}`,
      waLabel:"WhatsApp",
      waFallback:"Nomor WhatsApp resmi akan dihubungkan dari pengaturan bisnis setelah admin panel diaktifkan.",
      waMessage:"Halo, saya ingin bertanya tentang layanan Agung Ubud Property.",
      permitEyebrow:"Dokumentasi & izin properti",
      permitTitle:"Pengurusan izin bangunan yang lebih jelas dan terarah.",
      permitText:"Dapatkan bantuan koordinasi dokumen teknis dan administrasi SIMBG sebagai bagian dari layanan properti. Tujuannya membantu pemilik menyiapkan proses yang diperlukan dengan lebih rapi dan mengurangi kendala administrasi yang bisa dihindari.",
      permitCta:"Tanya layanan izin",
      permitOne:"Koordinasi dokumen",
      permitOneText:"Rapikan kebutuhan dokumen teknis sebelum proses administrasi dimulai.",
      permitTwo:"Pendampingan SIMBG",
      permitTwoText:"Koordinasikan alur administrasi izin bangunan melalui sistem resmi yang berlaku.",
      permitThree:"Layanan properti terintegrasi",
      permitThreeText:"Satukan pencarian properti dan kebutuhan bantuan izin dalam satu ekosistem layanan.",
      permitNote:"Ruang lingkup layanan dan kebutuhan dokumen dikonfirmasi setelah dokumen properti ditinjau.",
      permitInterest:"Izin Bangunan / SIMBG",
      permitMessage:"Halo, saya ingin informasi tentang bantuan pengurusan izin bangunan dan SIMBG untuk properti saya.",
      heroCopy:"Mulai dari vila privat dan sewa jangka panjang hingga tanah serta properti komersial. Temukan pilihan untuk hunian, investasi, dan rencana berikutnya.",
      trustCopy:"Presentasi premium, inquiry langsung, dan komunikasi yang siap untuk pasar internasional membuat setiap listing tampil lebih terawat. Layanan mencakup vila, rumah, tanah, sewa, dan properti komersial.",
      demoNote:"Hanya demo. Tidak ada data pribadi yang dikirim."
    }
  };
  const t=()=>copy[language()]||copy.en;

  function upgradeBrandLogo(){
    const brand=document.querySelector(".site-header .brand");
    if(!brand||brand.classList.contains("client-brand-visual"))return;
    brand.classList.add("client-brand-visual");
    brand.setAttribute("aria-label","Agung Ubud Property");
    brand.innerHTML=`<span class="client-brand-logo-shell"><img class="client-brand-logo" src="${BRAND_LOGO_URL}" alt="" width="150" height="114" decoding="async"></span>`;
  }

  function polishHomepageCopy(){
    const c=t();
    const hero=document.querySelector('[data-i18n="heroCopy"]');
    const trust=document.querySelector('[data-i18n="trustCopy"]');
    const note=document.querySelector('[data-i18n="demoNote"]');
    if(hero)hero.textContent=c.heroCopy;
    if(trust)trust.textContent=c.trustCopy;
    if(note)note.textContent=c.demoNote;
    document.title="Agung Ubud Property | Premium Bali Property";
    const meta=document.querySelector('meta[name="description"]');
    if(meta)meta.content=language()==="id"
      ?"Agung Ubud Property adalah konsep platform properti premium untuk vila, rumah, tanah, sewa, kos, layanan mobilitas, dan bantuan izin properti di Bali."
      :"Agung Ubud Property is a premium Bali property platform concept for villas, homes, land, rentals, boarding rooms, mobility, and property permit assistance.";
  }

  function addHeroSlideshow(){
    const hero=document.querySelector(".hero");
    const overlay=hero?.querySelector(".hero-overlay");
    if(!hero||!overlay||hero.querySelector(".hero-client-slider"))return;
    const images=[
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=90",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=90",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=2200&q=90",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2200&q=90"
    ];
    const slider=document.createElement("div");
    slider.className="hero-client-slider";
    slider.setAttribute("aria-hidden","true");
    slider.innerHTML=images.map((src,i)=>`<div class="hero-client-slide${i===0?" is-active":""}" style="background-image:url('${src}')"></div>`).join("");
    overlay.insertAdjacentElement("beforebegin",slider);

    const dots=document.createElement("div");
    dots.className="hero-client-dots";
    dots.innerHTML=images.map((_,i)=>`<button class="hero-client-dot${i===0?" is-active":""}" type="button" aria-label="Photo ${i+1}"></button>`).join("");
    hero.appendChild(dots);
    hero.classList.add("client-hero-slideshow");

    const slides=[...slider.children],buttons=[...dots.children];
    let active=0,timer=null;
    const show=index=>{
      active=(index+slides.length)%slides.length;
      slides.forEach((el,i)=>el.classList.toggle("is-active",i===active));
      buttons.forEach((el,i)=>el.classList.toggle("is-active",i===active));
    };
    const restart=()=>{
      clearInterval(timer);
      if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
        timer=setInterval(()=>show(active+1),5200);
      }
    };
    buttons.forEach((btn,i)=>btn.addEventListener("click",()=>{show(i);restart()}));
    document.addEventListener("visibilitychange",()=>{if(document.hidden)clearInterval(timer);else restart()});
    restart();
  }

  function listingCount(location){
    try{return Array.isArray(properties)?properties.filter(p=>p.location===location).length:0}catch{return 0}
  }
  function filterLocation(location){
    const form=document.getElementById("heroSearch");
    const locationSelect=document.getElementById("locationFilter");
    const type=document.getElementById("typeFilter");
    const purpose=document.getElementById("purposeFilter");
    if(!form||!locationSelect)return;
    locationSelect.value=location;
    if(type)type.value="all";
    if(purpose)purpose.value="all";
    form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));
  }
  function updateLocationCards(){
    document.querySelectorAll(".location-card.client-location-filter").forEach(card=>{
      const name=card.dataset.clientLocation;
      const count=listingCount(name);
      const meta=card.querySelector(".client-location-meta");
      card.setAttribute("aria-label",t().locationLabel(name));
      if(meta){
        const text=meta.querySelector(".client-location-count");
        if(text)text.textContent=t().locationAction(count);
      }
    });
  }
  function bindLocationCards(){
    document.querySelectorAll(".location-card").forEach(card=>{
      if(card.classList.contains("client-location-filter"))return;
      const name=card.querySelector("div > span")?.textContent?.trim();
      if(!name)return;
      card.classList.add("client-location-filter");
      card.dataset.clientLocation=name;
      card.tabIndex=0;
      card.setAttribute("role","button");
      const content=card.querySelector("div");
      if(content&&!content.querySelector(".client-location-meta")){
        const meta=document.createElement("span");
        meta.className="client-location-meta";
        meta.innerHTML='<span class="client-location-count"></span><span class="client-location-arrow">→</span>';
        content.appendChild(meta);
      }
      const activate=()=>filterLocation(name);
      card.addEventListener("click",activate);
      card.addEventListener("keydown",e=>{
        if(e.key==="Enter"||e.key===" "){
          e.preventDefault();
          activate();
        }
      });
    });
    updateLocationCards();
  }

  function ensurePermitInterest(){
    const select=document.querySelector('#contactForm select[name="interest"]');
    if(!select)return;
    let option=[...select.options].find(o=>o.dataset.clientPermit==="1");
    if(!option){
      option=document.createElement("option");
      option.dataset.clientPermit="1";
      select.appendChild(option);
    }
    option.value=t().permitInterest;
    option.textContent=t().permitInterest;
  }
  function fillPermitInquiry(){
    ensurePermitInterest();
    const form=document.getElementById("contactForm");
    const select=form?.querySelector('select[name="interest"]');
    const message=form?.querySelector('textarea[name="message"]');
    if(select){
      const option=[...select.options].find(o=>o.dataset.clientPermit==="1");
      if(option)select.value=option.value;
    }
    if(message)message.value=t().permitMessage;
    document.getElementById("contact")?.scrollIntoView({behavior:"smooth",block:"start"});
    setTimeout(()=>form?.querySelector('input[name="name"]')?.focus({preventScroll:true}),500);
  }
  function renderPermitService(){
    const services=document.getElementById("services");
    if(!services)return;
    let section=document.getElementById("permitService");
    if(!section){
      section=document.createElement("section");
      section.id="permitService";
      section.className="permit-service-section reveal-item";
      services.insertAdjacentElement("afterend",section);
    }
    const c=t();
    section.innerHTML=`<div class="permit-service-card"><div class="permit-service-copy"><p class="eyebrow">${c.permitEyebrow}</p><h2>${c.permitTitle}</h2><p>${c.permitText}</p><div class="permit-service-actions"><button type="button" class="permit-service-primary" id="permitInquiryBtn">${c.permitCta}</button></div><small class="permit-service-note">${c.permitNote}</small></div><div class="permit-service-points"><article class="permit-service-point"><span>01</span><div><strong>${c.permitOne}</strong><p>${c.permitOneText}</p></div></article><article class="permit-service-point"><span>02</span><div><strong>${c.permitTwo}</strong><p>${c.permitTwoText}</p></div></article><article class="permit-service-point"><span>03</span><div><strong>${c.permitThree}</strong><p>${c.permitThreeText}</p></div></article></div></div>`;
    section.querySelector("#permitInquiryBtn")?.addEventListener("click",fillPermitInquiry);
    ensurePermitInterest();
    if(typeof observeReveals==="function")observeReveals(section);
  }

  function configuredWhatsApp(){
    const candidate=window.AUP_PUBLIC_SETTINGS?.whatsapp||document.body.dataset.whatsapp||window.AUP_WHATSAPP_NUMBER||"";
    return String(candidate).replace(/\D/g,"");
  }
  function showFallbackToast(){
    const toast=document.getElementById("toast");
    if(!toast)return;
    toast.textContent=t().waFallback;
    toast.classList.add("show");
    clearTimeout(window.__clientWaToast);
    window.__clientWaToast=setTimeout(()=>toast.classList.remove("show"),3200);
  }
  function addWhatsAppButton(){
    if(document.querySelector(".floating-whatsapp"))return;
    const raw=configuredWhatsApp();
    const link=document.createElement("a");
    link.className="floating-whatsapp";
    link.setAttribute("aria-label",t().waLabel);
    link.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.02 4.8A11.14 11.14 0 0 0 6.5 21.7L5 27.2l5.62-1.47A11.17 11.17 0 1 0 16.02 4.8Zm0 20.3a9.23 9.23 0 0 1-4.7-1.28l-.34-.2-3.34.88.9-3.25-.22-.34a9.25 9.25 0 1 1 7.7 4.19Zm5.08-6.92c-.28-.14-1.65-.81-1.9-.9-.26-.1-.45-.14-.64.14-.19.28-.73.9-.9 1.09-.16.19-.33.21-.61.07-.28-.14-1.18-.43-2.25-1.39a8.43 8.43 0 0 1-1.55-1.93c-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.03 2.81 1.17 3c.14.19 2.02 3.09 4.9 4.33.68.3 1.22.47 1.64.6.69.22 1.31.19 1.8.12.55-.08 1.65-.68 1.88-1.33.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33Z"/></svg><span class="client-wa-label"></span>';
    document.body.appendChild(link);
    if(raw){
      link.href=`https://wa.me/${raw}?text=${encodeURIComponent(t().waMessage)}`;
      link.target="_blank";
      link.rel="noopener noreferrer";
    }else{
      link.href="#contact";
      link.addEventListener("click",e=>{
        e.preventDefault();
        const textarea=document.querySelector('#contactForm textarea[name="message"]');
        if(textarea&&!textarea.value)textarea.value=t().waMessage;
        document.getElementById("contact")?.scrollIntoView({behavior:"smooth",block:"start"});
        showFallbackToast();
      });
    }
    updateWhatsAppCopy();
  }
  function updateWhatsAppCopy(){
    const link=document.querySelector(".floating-whatsapp");
    if(!link)return;
    link.setAttribute("aria-label",t().waLabel);
    const label=link.querySelector(".client-wa-label");
    if(label)label.textContent=t().waLabel;
  }

  function refreshCopy(){
    polishHomepageCopy();
    updateLocationCards();
    renderPermitService();
    updateWhatsAppCopy();
  }

  upgradeBrandLogo();
  polishHomepageCopy();
  addHeroSlideshow();
  bindLocationCards();
  renderPermitService();
  addWhatsAppButton();
  document.getElementById("languageToggle")?.addEventListener("click",()=>setTimeout(refreshCopy,0));
})();
