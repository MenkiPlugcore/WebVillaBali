(() => {
  if (typeof properties === "undefined" || typeof translations === "undefined") return;

  if(!document.querySelector('link[href="living-mobility.css"]')){
    const css=document.createElement("link");
    css.rel="stylesheet";
    css.href="living-mobility.css";
    document.head.appendChild(css);
  }


  const copy={
    en:{
      eyebrow:"Long stay & mobility",title:"Stay longer. Move easier.",intro:"Beyond villas and investment property, the platform can also help visitors find practical monthly rooms and everyday transport in Bali.",sample:"Concept preview · sample inventory",
      kostLabel:"Monthly living",kostTitle:"Kost & boarding rooms",kostDesc:"Simple long-stay options for students, workers, digital nomads, and guests who need a practical Bali base.",kostCopy:"Private furnished room with en-suite bathroom, Wi-Fi, shared kitchen access, and a calm Ubud setting.",kostSecond:"Canggu Workstay Room",kostSecondCopy:"Compact monthly room concept near cafés and coworking areas, designed for longer stays.",view:"View details",ask:"Ask availability",perMonth:"/ month",footerKost:"Monthly room availability can change quickly.",seeKost:"Show Kost listings",
      bikeLabel:"Daily mobility",bikeTitle:"Motorbike rental",bikeDesc:"Motorbike rental now has its own dedicated page, so guests can compare models, daily and monthly rates, delivery options, and send a rental inquiry without mixing it into the property catalogue.",bikeFeatureOne:"Daily & monthly plans",bikeFeatureTwo:"2 helmets included",bikeFeatureThree:"Delivery available",bikeFeatureFour:"Manual availability confirmation",bikeCta:"Explore motorbike rental",bikeNote:"Dedicated rental page · sample inventory",
      interestKost:"Kost / Boarding House"
    },
    id:{
      eyebrow:"Long stay & mobilitas",title:"Tinggal lebih lama. Bergerak lebih mudah.",intro:"Selain vila dan properti investasi, platform ini juga bisa membantu pengunjung menemukan kamar bulanan yang praktis serta kendaraan untuk kebutuhan harian di Bali.",sample:"Pratinjau konsep · inventori contoh",
      kostLabel:"Hunian bulanan",kostTitle:"Kos & kamar bulanan",kostDesc:"Pilihan long-stay sederhana untuk pelajar, pekerja, digital nomad, dan tamu yang membutuhkan tempat tinggal praktis di Bali.",kostCopy:"Kamar privat berperabot dengan kamar mandi dalam, Wi-Fi, akses dapur bersama, dan suasana Ubud yang tenang.",kostSecond:"Canggu Workstay Room",kostSecondCopy:"Konsep kamar bulanan compact dekat kafe dan area coworking untuk masa tinggal lebih panjang.",view:"Lihat detail",ask:"Tanya ketersediaan",perMonth:"/ bulan",footerKost:"Ketersediaan kamar bulanan dapat berubah dengan cepat.",seeKost:"Lihat listing Kos",
      bikeLabel:"Mobilitas harian",bikeTitle:"Rental motor",bikeDesc:"Rental motor sekarang punya halaman khusus agar pengunjung bisa membandingkan tipe motor, harga harian dan bulanan, opsi antar, serta mengirim inquiry rental tanpa tercampur dengan katalog properti.",bikeFeatureOne:"Paket harian & bulanan",bikeFeatureTwo:"Termasuk 2 helm",bikeFeatureThree:"Bisa diantar",bikeFeatureFour:"Ketersediaan dikonfirmasi admin",bikeCta:"Lihat rental motor",bikeNote:"Halaman rental khusus · inventori contoh",
      interestKost:"Kos / Kamar Bulanan"
    }
  };

  function t(){return copy[language]||copy.en}
  function formatMoney(usd,idr){return currency==="USD"?`$${usd.toLocaleString("en-US")}`:`Rp ${idr.toLocaleString("id-ID")}`}

  function injectFilters(){
    const type=document.getElementById("typeFilter");
    if(type&&!type.querySelector('option[value="Kost"]')){
      const o=document.createElement("option");o.value="Kost";o.textContent=language==="id"?"Kos / Kamar Bulanan":"Kost / Boarding";type.appendChild(o);
    }
    const row=document.getElementById("filterRow");
    if(row&&!row.querySelector('[data-filter="Kost"]')){
      const btn=document.createElement("button");btn.className="filter-chip";btn.type="button";btn.dataset.filter="Kost";btn.textContent="Kost";
      btn.addEventListener("click",()=>{
        document.querySelectorAll(".filter-chip").forEach(c=>c.classList.remove("active"));
        btn.classList.add("active");activeType="Kost";
        if(initializing)finishInitialLoad();else renderProperties();
      });
      row.appendChild(btn);
    }
    const interest=document.querySelector('#contactForm select[name="interest"]');
    if(interest&&!interest.querySelector('option[value="Kost / Boarding House"]')){
      const o=document.createElement("option");o.value="Kost / Boarding House";o.textContent=t().interestKost;interest.appendChild(o);
    }
  }

  function focusKostContact(){
    const form=document.getElementById("contactForm");if(!form)return;
    const select=form.querySelector('select[name="interest"]');if(select)select.value="Kost / Boarding House";
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
    if(interest){const a=interest.querySelector('option[value="Kost / Boarding House"]');if(a)a.textContent=t().interestKost;}

    let section=document.getElementById("livingMobility");
    if(!section){
      section=document.createElement("section");section.id="livingMobility";section.className="living-mobility-section reveal-item";
      document.getElementById("services")?.insertAdjacentElement("beforebegin",section);
    }
    const c=t();
    section.innerHTML=`
      <div class="shell">
        <div class="lm-heading">
          <div><p class="eyebrow dark">${c.eyebrow}</p><h2>${c.title}</h2></div>
          <p>${c.intro}<span class="lm-demo-note"></span></p>
        </div>
        <div class="lm-grid">
          <article class="lm-panel" id="kostLiving">
            <div class="lm-panel-head"><div><span>${c.kostLabel}</span><h3>${c.kostTitle}</h3></div><p>${c.kostDesc}</p></div>
            <div class="lm-card-list">
              ${properties.filter(p=>p.type==='Kost').slice(0,2).map(AUPCatalog.view).map(p=>`<div class="stay-card"><div class="lm-card-image" style="background-image:url('${p.image}')"></div><div class="lm-card-body"><span class="lm-card-meta">${p.location} · Kost</span><h4 class="lm-card-title">${p.title}</h4><div class="lm-price-row"><span class="lm-price"><strong>${money(p)}</strong><small>${suffix(p)}</small></span><a class="lm-action" href="${AUPCatalog.href(p.slug)}">${c.view}</a></div></div></div>`).join('')||`<p class="lm-card-copy">${language==='id'?'Pilihan kamar bulanan sedang disiapkan.':'Monthly room listings are being prepared.'}</p>`}
            </div>
            <div class="lm-panel-footer"><span>${c.footerKost}</span><button type="button" id="showKostListings">${c.seeKost} →</button></div>
          </article>

          <article class="lm-panel motor-teaser-panel">
            <div class="motor-teaser-media" aria-hidden="true"></div>
            <div class="motor-teaser-overlay"></div>
            <div class="motor-teaser-content">
              <span class="motor-teaser-label">${c.bikeLabel}</span>
              <h3>${c.bikeTitle}</h3>
              <p>${c.bikeDesc}</p>
              <div class="motor-teaser-features"><span>${c.bikeFeatureOne}</span><span>${c.bikeFeatureTwo}</span><span>${c.bikeFeatureThree}</span><span>${c.bikeFeatureFour}</span></div>
              <div class="motor-teaser-footer"><small>${c.bikeNote}</small><a class="motor-teaser-cta" href="motor-rental.html">${c.bikeCta} →</a></div>
            </div>
          </article>
        </div>
      </div>`;

    section.querySelector('[data-lm-kost-contact]')?.addEventListener("click",focusKostContact);
    document.getElementById("showKostListings")?.addEventListener("click",showKost);
    if(typeof observeReveals==="function")observeReveals(section);
  }

  injectFilters();
  renderSection();
  document.addEventListener("aup:properties-rendered",renderSection);
  languageToggle?.addEventListener("click",()=>setTimeout(renderSection,0));
  currencyToggle?.addEventListener("click",()=>setTimeout(renderSection,0));
})();
