(() => {
  const languageButton=document.getElementById("rentalLanguage");
  const currencyButton=document.getElementById("rentalCurrency");
  const menuButton=document.getElementById("rentalMenuButton");
  const mobileMenu=document.getElementById("rentalMobileMenu");
  const fleetGrid=document.getElementById("rentalFleetGrid");
  const bikeSelect=document.getElementById("rentalBike");
  const planSelect=document.getElementById("rentalPlan");
  const durationInput=document.getElementById("rentalDuration");
  const estimate=document.getElementById("rentalEstimate");
  const estimateNote=document.getElementById("rentalEstimateNote");
  const form=document.getElementById("rentalForm");
  const toast=document.getElementById("rentalToast");

  let language=localStorage.getItem("aup-language")||"en";
  let currency=localStorage.getItem("aup-currency")||"USD";
  let rateView="daily";

  const bikes=[
    {id:"scoopy",name:"Honda Scoopy",engine:"110 cc",style:"City scooter",styleId:"Scooter kota",usdDay:5,idrDay:80000,usdMonth:92,idrMonth:1450000,image:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=86",descEn:"Light, friendly, and easy for everyday rides around town.",descId:"Ringan, mudah dikendarai, dan cocok untuk mobilitas harian di area kota."},
    {id:"vario160",name:"Honda Vario 160",engine:"160 cc",style:"Everyday performance",styleId:"Performa harian",usdDay:7,idrDay:110000,usdMonth:125,idrMonth:1950000,image:"https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=86",descEn:"A practical step up for longer routes and daily mobility.",descId:"Pilihan praktis untuk perjalanan lebih jauh dan mobilitas sehari-hari."},
    {id:"nmax",name:"Yamaha NMAX",engine:"155 cc",style:"Maxi scooter",styleId:"Maxi scooter",usdDay:10,idrDay:155000,usdMonth:180,idrMonth:2800000,image:"https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=1200&q=86",descEn:"More comfort and road presence for longer Bali rides.",descId:"Lebih nyaman dan mantap untuk perjalanan yang lebih panjang di Bali."}
  ];

  const copy={
    en:{navProperties:"Properties",navLongStay:"Long stay",navServices:"Services",navAbout:"About",navFleet:"Motorbike fleet",navReserve:"Ask availability",back:"← Back to Bali living",heroEyebrow:"Bali motorbike rental",heroTitle:"Ride Bali,<br>your way.",heroCopy:"Choose a practical scooter for a few days or a full month. Compare sample rates, included essentials, and send one simple availability request.",browseFleet:"Browse motorbikes",askNow:"Ask availability",trustDaily:"Daily & monthly plans",trustHelmets:"2 helmets included",trustDelivery:"Delivery option",trustManual:"Manual confirmation",introEyebrow:"Simple rental flow",introTitle:"Pick a bike. Choose a plan. Confirm with the team.",introCopy:"This is a concept preview. Production inventory, deposits, driver requirements, delivery coverage, and final rates are confirmed manually before payment.",sampleRates:"Sample rates only",fleetEyebrow:"Available models",fleetTitle:"Choose the ride that fits your stay.",daily:"Daily",monthly:"Monthly",automatic:"Automatic",helmets:"2 helmets",delivery:"Delivery option",choose:"Choose this bike",perDay:"/ day",perMonth:"/ month",includedEyebrow:"Designed for everyday Bali mobility",includedTitle:"The basics are clear before you ride.",includedCopy:"Keep the rental experience straightforward with essential equipment, clear duration options, and admin-confirmed pickup or delivery.",includeOneTitle:"Two helmets",includeOneCopy:"Two standard helmets are included with each sample rental package.",includeTwoTitle:"Delivery coordination",includeTwoCopy:"Ask the team about delivery and collection coverage for your area.",includeThreeTitle:"Daily or monthly",includeThreeCopy:"Choose a short daily rental or a longer monthly plan.",includeFourTitle:"Manual confirmation",includeFourCopy:"Availability and final rental terms are confirmed by the admin before payment.",inquiryEyebrow:"Rental inquiry",inquiryTitle:"Tell us what you need.",inquiryCopy:"Select a bike and rental duration. The estimated total below is for the concept preview only; the team confirms the final rate, deposit, availability, and delivery details.",estimateLabel:"Estimated sample total",estimateDaily:n=>`${n} day${n===1?"":"s"}`,estimateMonthly:n=>`${n} month${n===1?"":"s"}`,bikeLabel:"Motorbike",planLabel:"Plan",startLabel:"Start date",durationLabel:"Duration",nameLabel:"Name",contactLabel:"WhatsApp / Email",areaLabel:"Pickup / delivery area",messageLabel:"Notes",submit:"Send rental inquiry",formNote:"Demo only — no personal data is transmitted.",sent:"Rental inquiry demo received — no data was sent.",footerCopy:"Property, long-stay living, and practical Bali mobility in one premium platform concept.",footerExplore:"Explore",footerContact:"Contact"},
    id:{navProperties:"Properti",navLongStay:"Long stay",navServices:"Layanan",navAbout:"Tentang",navFleet:"Pilihan motor",navReserve:"Tanya ketersediaan",back:"← Kembali ke Bali living",heroEyebrow:"Rental motor Bali",heroTitle:"Keliling Bali,<br>lebih fleksibel.",heroCopy:"Pilih motor praktis untuk beberapa hari atau satu bulan penuh. Bandingkan harga contoh, fasilitas yang termasuk, lalu kirim satu inquiry ketersediaan.",browseFleet:"Lihat pilihan motor",askNow:"Tanya ketersediaan",trustDaily:"Paket harian & bulanan",trustHelmets:"Termasuk 2 helm",trustDelivery:"Bisa diantar",trustManual:"Konfirmasi manual",introEyebrow:"Alur rental sederhana",introTitle:"Pilih motor. Tentukan paket. Konfirmasi dengan tim.",introCopy:"Ini masih pratinjau konsep. Inventori produksi, deposit, persyaratan pengemudi, area antar, dan tarif final dikonfirmasi manual sebelum pembayaran.",sampleRates:"Harga masih contoh",fleetEyebrow:"Pilihan motor",fleetTitle:"Pilih motor yang cocok untuk kebutuhanmu.",daily:"Harian",monthly:"Bulanan",automatic:"Matic",helmets:"2 helm",delivery:"Bisa diantar",choose:"Pilih motor ini",perDay:"/ hari",perMonth:"/ bulan",includedEyebrow:"Untuk mobilitas harian di Bali",includedTitle:"Hal penting dibuat jelas sebelum berkendara.",includedCopy:"Pengalaman rental dibuat sederhana dengan perlengkapan dasar, pilihan durasi yang jelas, serta pickup atau pengantaran yang dikonfirmasi admin.",includeOneTitle:"Dua helm",includeOneCopy:"Dua helm standar termasuk di setiap paket rental contoh.",includeTwoTitle:"Koordinasi pengantaran",includeTwoCopy:"Tanyakan ke tim mengenai cakupan area antar dan pengambilan motor.",includeThreeTitle:"Harian atau bulanan",includeThreeCopy:"Pilih rental singkat harian atau paket bulanan untuk masa tinggal lebih lama.",includeFourTitle:"Konfirmasi manual",includeFourCopy:"Ketersediaan dan ketentuan rental final dikonfirmasi admin sebelum pembayaran.",inquiryEyebrow:"Inquiry rental",inquiryTitle:"Ceritakan kebutuhanmu.",inquiryCopy:"Pilih motor dan durasi rental. Estimasi total di bawah hanya untuk pratinjau konsep; tim akan mengonfirmasi tarif final, deposit, ketersediaan, dan detail pengantaran.",estimateLabel:"Estimasi total contoh",estimateDaily:n=>`${n} hari`,estimateMonthly:n=>`${n} bulan`,bikeLabel:"Motor",planLabel:"Paket",startLabel:"Tanggal mulai",durationLabel:"Durasi",nameLabel:"Nama",contactLabel:"WhatsApp / Email",areaLabel:"Area pickup / pengantaran",messageLabel:"Catatan",submit:"Kirim inquiry rental",formNote:"Hanya demo — tidak ada data pribadi yang dikirim.",sent:"Inquiry rental demo diterima — tidak ada data yang dikirim.",footerCopy:"Properti, hunian long-stay, dan mobilitas praktis Bali dalam satu konsep platform premium.",footerExplore:"Jelajahi",footerContact:"Kontak"}
  };

  function t(){return copy[language]||copy.en}
  function format(valueUsd,valueIdr){return currency==="USD"?`$${valueUsd.toLocaleString("en-US")}`:`Rp ${valueIdr.toLocaleString("id-ID")}`}
  function bikeById(id){return bikes.find(b=>b.id===id)||bikes[0]}

  function renderCopy(){
    document.documentElement.lang=language;
    document.querySelectorAll("[data-rental-i18n]").forEach(el=>{const value=t()[el.dataset.rentalI18n];if(typeof value==="string")el.innerHTML=value;});
    if(languageButton)languageButton.textContent=language.toUpperCase();
    if(currencyButton)currencyButton.textContent=currency;
  }
  function renderBikeOptions(){
    if(!bikeSelect)return;
    const current=bikeSelect.value;
    bikeSelect.innerHTML=bikes.map(b=>`<option value="${b.id}">${b.name}</option>`).join("");
    if(bikes.some(b=>b.id===current))bikeSelect.value=current;
  }
  function renderFleet(){
    if(!fleetGrid)return;
    const c=t();
    fleetGrid.innerHTML=bikes.map(b=>{
      const daily=rateView==="daily";
      const price=daily?format(b.usdDay,b.idrDay):format(b.usdMonth,b.idrMonth);
      const suffix=daily?c.perDay:c.perMonth;
      const desc=language==="id"?b.descId:b.descEn;
      const style=language==="id"?b.styleId:b.style;
      return `<article class="rental-bike-card"><div class="rental-bike-media" style="background-image:url('${b.image}')"><span class="rental-bike-badge">${style}</span></div><div class="rental-bike-body"><span class="rental-bike-meta">${b.engine} · ${c.automatic}</span><h3 class="rental-bike-title">${b.name}</h3><p class="rental-bike-desc">${desc}</p><div class="rental-bike-specs"><span>${c.automatic}</span><span>${c.helmets}</span><span>${c.delivery}</span></div><div class="rental-bike-price"><span><strong>${price}</strong><small>${suffix}</small></span><button class="rental-bike-select" type="button" data-bike-select="${b.id}">${c.choose}</button></div></div></article>`;
    }).join("");
    fleetGrid.querySelectorAll("[data-bike-select]").forEach(btn=>btn.addEventListener("click",()=>{if(bikeSelect)bikeSelect.value=btn.dataset.bikeSelect;if(planSelect)planSelect.value=rateView;updateEstimate();document.getElementById("rentalInquiry")?.scrollIntoView({behavior:"smooth",block:"start"});}));
  }
  function updateEstimate(){
    if(!estimate||!estimateNote)return;
    const bike=bikeById(bikeSelect?.value);
    const plan=planSelect?.value||"daily";
    const duration=Math.max(1,Number(durationInput?.value||1));
    const totalUsd=(plan==="daily"?bike.usdDay:bike.usdMonth)*duration;
    const totalIdr=(plan==="daily"?bike.idrDay:bike.idrMonth)*duration;
    estimate.textContent=format(totalUsd,totalIdr);
    estimateNote.textContent=`${bike.name} · ${plan==="daily"?t().estimateDaily(duration):t().estimateMonthly(duration)}`;
  }
  function showToast(message){if(!toast)return;toast.textContent=message;toast.classList.add("show");clearTimeout(window.__rentalToast);window.__rentalToast=setTimeout(()=>toast.classList.remove("show"),2600)}

  document.querySelectorAll("[data-rate-view]").forEach(btn=>btn.addEventListener("click",()=>{rateView=btn.dataset.rateView;document.querySelectorAll("[data-rate-view]").forEach(b=>b.classList.toggle("is-active",b===btn));renderFleet();}));
  languageButton?.addEventListener("click",()=>{language=language==="en"?"id":"en";localStorage.setItem("aup-language",language);renderCopy();renderBikeOptions();renderFleet();updateEstimate();});
  currencyButton?.addEventListener("click",()=>{currency=currency==="USD"?"IDR":"USD";localStorage.setItem("aup-currency",currency);renderCopy();renderFleet();updateEstimate();});
  menuButton?.addEventListener("click",()=>{const open=menuButton.getAttribute("aria-expanded")==="true";menuButton.setAttribute("aria-expanded",String(!open));mobileMenu?.classList.toggle("open",!open);});
  mobileMenu?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{mobileMenu.classList.remove("open");menuButton?.setAttribute("aria-expanded","false");}));
  bikeSelect?.addEventListener("change",updateEstimate);
  planSelect?.addEventListener("change",()=>{rateView=planSelect.value;document.querySelectorAll("[data-rate-view]").forEach(b=>b.classList.toggle("is-active",b.dataset.rateView===rateView));renderFleet();updateEstimate();});
  durationInput?.addEventListener("input",updateEstimate);
  form?.addEventListener("submit",event=>{event.preventDefault();showToast(t().sent);event.currentTarget.reset();renderBikeOptions();if(planSelect)planSelect.value="daily";if(durationInput)durationInput.value="3";rateView="daily";document.querySelectorAll("[data-rate-view]").forEach(b=>b.classList.toggle("is-active",b.dataset.rateView==="daily"));renderFleet();updateEstimate();});

  renderCopy();renderBikeOptions();renderFleet();updateEstimate();
})();