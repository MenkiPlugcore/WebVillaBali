(() => {
  if (typeof properties === "undefined" || typeof translations === "undefined") return;

  const kostProperty={id:7,slug:"ubud-green-kost",title:"Ubud Green Kost",location:"Ubud",type:"Kost",purpose:"rent",usd:230,idr:3600000,priceSuffix:"month",beds:1,baths:1,area:"24 m²",featured:false,image:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=88"};
  if(!properties.some(p=>p.slug===kostProperty.slug)) properties.push(kostProperty);

  const copy={
    en:{eyebrow:"Long stay & mobility",title:"Stay longer. Move easier.",intro:"Beyond villas and investment property, the platform can also help visitors find practical monthly rooms and everyday transport in Bali.",sample:"Concept preview · sample inventory",kostLabel:"Monthly living",kostTitle:"Kost & boarding rooms",kostDesc:"Simple long-stay options for students, workers, digital nomads, and guests who need a practical Bali base.",kostCopy:"Private furnished room with en-suite bathroom, Wi-Fi, shared kitchen access, and a calm Ubud setting.",kostSecond:"Canggu Workstay Room",kostSecondCopy:"Compact monthly room concept near cafés and coworking areas, designed for longer stays.",view:"View details",ask:"Ask availability",perMonth:"/ month",bikeLabel:"Daily mobility",bikeTitle:"Motorbike rental",bikeDesc:"A simple rental showcase for guests who need transport during their stay. Production availability can be confirmed manually by the team.",perDay:"/ day",automatic:"Automatic",helmets:"2 helmets",delivery:"Delivery option",footerKost:"Monthly room availability can change quickly.",footerBike:"Demo prices only — final rates and deposit terms are confirmed by admin.",seeKost:"Show Kost listings",contactBike:"Ask about motor rental",interestKost:"Kost / Boarding House",interestBike:"Motorbike Rental",bikeMessage:"Hi, I would like to ask about motorbike rental availability."},
    id:{eyebrow:"Long stay & mobilitas",title:"Tinggal lebih lama. Bergerak lebih mudah.",intro:"Selain vila dan properti investasi, platform ini juga bisa membantu pengunjung menemukan kamar bulanan yang praktis serta kendaraan untuk kebutuhan harian di Bali.",sample:"Pratinjau konsep · inventori contoh",kostLabel:"Hunian bulanan",kostTitle:"Kos & kamar bulanan",kostDesc:"Pilihan long-stay sederhana untuk pelajar, pekerja, digital nomad, dan tamu yang membutuhkan tempat tinggal praktis di Bali.",kostCopy:"Kamar privat berperabot dengan kamar mandi dalam, Wi-Fi, akses dapur bersama, dan suasana Ubud yang tenang.",kostSecond:"Canggu Workstay Room",kostSecondCopy:"Konsep kamar bulanan compact dekat kafe dan area coworking untuk masa tinggal lebih panjang.",view:"Lihat detail",ask:"Tanya ketersediaan",perMonth:"/ bulan",bikeLabel:"Mobilitas harian",bikeTitle:"Rental motor",bikeDesc:"Pilihan rental sederhana untuk tamu yang membutuhkan kendaraan selama tinggal di Bali. Ketersediaan produksi dapat dikonfirmasi manual oleh tim.",perDay:"/ hari",automatic:"Matic",helmets:"2 helm",delivery:"Bisa diantar",footerKost:"Ketersediaan kamar bulanan dapat berubah dengan cepat.",footerBike:"Harga masih dummy — tarif final dan ketentuan deposit dikonfirmasi admin.",seeKost:"Lihat listing Kos",contactBike:"Tanya rental motor",interestKost:"Kos / Kamar Bulanan",interestBike:"Rental Motor",bikeMessage:"Halo, saya ingin menanyakan ketersediaan rental motor."}
  };

  function t(){return copy[language]||copy.en}
  function formatMoney(usd,idr){return currency==="USD"?`$${usd.toLocaleString("en-US")}`:`Rp ${idr.toLocaleString("id-ID")}`}

  function injectFilters(){
    const type=document.getElementById("typeFilter");
    if(type&&!type.querySelector('option[value="Kost"]')){const o=document.createElement("option");o.value="Kost";o.textContent=language==="id"?"Kos / Kamar Bulanan":"Kost / Boarding";type.appendChild(o)}
    const row=document.getElementById("filterRow");
    if(row&&!row.querySelector('[data-filter="Kost"]')){
      const btn=document.createElement("button");btn.className="filter-chip";btn.type="button";btn.dataset.filter="Kost";btn.textContent="Kost";
      btn.addEventListener("click",()=>{document.querySelectorAll(".filter-chip").forEach(c=>c.classList.remove("active"));btn.classList.add("active");activeType="Kost";if(initializing)finishInitialLoad();else renderProperties()});
      row.appendChild(btn)
    }
    const interest=document.querySelector('#contactForm select[name="interest"]');
    if(interest){
      if(!interest.querySelector('option[value="Kost / Boarding House"]')){const o=document.createElement("option");o.value="Kost / Boarding House";o.textContent=t().interestKost;interest.appendChild(o)}
      if(!interest.querySelector('option[value="Motorbike Rental"]')){const o=document.createElement("option");o.value="Motorbike Rental";o.textContent=t().interestBike;interest.appendChild(o)}
    }
  }

  function focusContact(kind){
    const form=document.getElementById("contactForm");if(!form)return;
    const select=form.querySelector('select[name="interest"]');
    if(select)select.value=kind==="bike"?"Motorbike Rental":"Kost / Boarding House";
    if(kind==="bike"){const area=form.querySelector('textarea[name="message"]');if(area&&!area.value)area.value=t().bikeMessage}
    document.getElementById("contact")?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function showKost(){
    activeType="Kost";
    document.querySelectorAll(".filter-chip").forEach(c=>c.classList.toggle("active",c.dataset.filter==="Kost"));
    if(initializing)finishInitialLoad();else renderProperties();
    document.getElementById("properties")?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderSection(){
    injectFilters();
    const type=document.getElementById("typeFilter")?.querySelector('option[value="Kost"]');if(type)type.textContent=language==="id"?"Kos / Kamar Bulanan":"Kost / Boarding";
    const interest=document.querySelector('#contactForm select[name="interest"]');
    if(interest){const a=interest.querySelector('option[value="Kost / Boarding House"]');const b=interest.querySelector('option[value="Motorbike Rental"]');if(a)a.textContent=t().interestKost;if(b)b.textContent=t().interestBike}

    let section=document.getElementById("livingMobility");
    if(!section){section=document.createElement("section");section.id="livingMobility";section.className="living-mobility-section reveal-item";document.getElementById("services")?.insertAdjacentElement("beforebegin",section)}
    const c=t();
    const bikes=[
      {name:"Honda Scoopy",image:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=84",usd:5,idr:80000,monthUsd:92,monthIdr:1450000},
      {name:"Honda Vario 160",image:"https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=900&q=84",usd:7,idr:110000,monthUsd:125,monthIdr:1950000},
      {name:"Yamaha NMAX",image:"https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=900&q=84",usd:10,idr:155000,monthUsd:180,monthIdr:2800000}
    ];
    section.innerHTML=`<div class="shell"><div class="lm-heading"><div><p class="eyebrow dark">${c.eyebrow}</p><h2>${c.title}</h2></div><p>${c.intro}<span class="lm-demo-note">${c.sample}</span></p></div><div class="lm-grid"><article class="lm-panel"><div class="lm-panel-head"><div><span>${c.kostLabel}</span><h3>${c.kostTitle}</h3></div><p>${c.kostDesc}</p></div><div class="lm-card-list"><div class="stay-card"><div class="lm-card-image" style="background-image:url('${kostProperty.image}')"></div><div class="lm-card-body"><span class="lm-card-meta">Ubud · Kost · ${language==="id"?"Bulanan":"Monthly"}</span><h4 class="lm-card-title">${kostProperty.title}</h4><p class="lm-card-copy">${c.kostCopy}</p><div class="lm-price-row"><span class="lm-price"><strong>${formatMoney(kostProperty.usd,kostProperty.idr)}</strong><small>${c.perMonth}</small></span><a class="lm-action" href="properties/ubud-green-kost.html">${c.view}</a></div></div></div><div class="stay-card"><div class="lm-card-image" style="background-image:url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=84')"></div><div class="lm-card-body"><span class="lm-card-meta">Canggu · Kost · ${language==="id"?"Bulanan":"Monthly"}</span><h4 class="lm-card-title">${c.kostSecond}</h4><p class="lm-card-copy">${c.kostSecondCopy}</p><div class="lm-price-row"><span class="lm-price"><strong>${formatMoney(305,4800000)}</strong><small>${c.perMonth}</small></span><button class="lm-action" type="button" data-lm-contact="kost">${c.ask}</button></div></div></div></div><div class="lm-panel-footer"><span>${c.footerKost}</span><button type="button" id="showKostListings">${c.seeKost} →</button></div></article><article class="lm-panel"><div class="lm-panel-head"><div><span>${c.bikeLabel}</span><h3>${c.bikeTitle}</h3></div><p>${c.bikeDesc}</p></div><div class="lm-card-list">${bikes.map(b=>`<div class="bike-card"><div class="lm-card-image" style="background-image:url('${b.image}')"></div><div class="lm-card-body"><span class="lm-card-meta">${c.bikeLabel}</span><h4 class="lm-card-title">${b.name}</h4><div class="bike-specs"><span>${c.automatic}</span><span>${c.helmets}</span><span>${c.delivery}</span></div><div class="lm-price-row"><span class="lm-price"><strong>${formatMoney(b.usd,b.idr)}</strong><small>${c.perDay} · ${formatMoney(b.monthUsd,b.monthIdr)} ${c.perMonth}</small></span><button class="lm-action" type="button" data-lm-contact="bike">${c.ask}</button></div></div></div>`).join("")}</div><div class="lm-panel-footer"><span>${c.footerBike}</span><button type="button" data-lm-contact="bike">${c.contactBike} →</button></div></article></div></div>`;
    section.querySelectorAll('[data-lm-contact="bike"]').forEach(btn=>btn.addEventListener("click",()=>focusContact("bike")));
    section.querySelectorAll('[data-lm-contact="kost"]').forEach(btn=>btn.addEventListener("click",()=>focusContact("kost")));
    document.getElementById("showKostListings")?.addEventListener("click",showKost);
    if(typeof observeReveals==="function")observeReveals(section)
  }

  injectFilters();
  renderSection();
  languageToggle?.addEventListener("click",()=>setTimeout(renderSection,0));
  currencyToggle?.addEventListener("click",()=>setTimeout(renderSection,0));
})();
