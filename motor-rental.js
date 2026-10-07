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

  let language=localStorage.getItem("aup-language")==="id"?"id":"en";
  let currency=localStorage.getItem("aup-currency")||"USD";
  let rateView="daily";

  const bikes=[];
  let loading=true,loadError=false;
  const esc=AUPCatalog.escape;

  const copy={
    en:{navProperties:"Properties",navLongStay:"Long stay",navServices:"Services",navAbout:"About",navFleet:"Motorbike fleet",navReserve:"Ask availability",back:"← Back to Bali living",heroEyebrow:"Bali motorbike rental",heroTitle:"Ride Bali,<br>your way.",heroCopy:"Choose a practical scooter for a few days or a full month. Compare sample rates, included essentials, and send one simple availability request.",browseFleet:"Browse motorbikes",askNow:"Ask availability",trustDaily:"Daily & monthly plans",trustHelmets:"2 helmets included",trustDelivery:"Delivery option",trustManual:"Manual confirmation",introEyebrow:"Simple rental flow",introTitle:"Pick a bike. Choose a plan. Confirm with the team.",introCopy:"This is a concept preview. Production inventory, deposits, driver requirements, delivery coverage, and final rates are confirmed manually before payment.",sampleRates:"Sample rates only",fleetEyebrow:"Available models",fleetTitle:"Choose the ride that fits your stay.",daily:"Daily",monthly:"Monthly",automatic:"Automatic",helmets:"2 helmets",delivery:"Delivery option",choose:"Choose this bike",perDay:"/ day",perMonth:"/ month",includedEyebrow:"Designed for everyday Bali mobility",includedTitle:"The basics are clear before you ride.",includedCopy:"Keep the rental experience straightforward with essential equipment, clear duration options, and admin-confirmed pickup or delivery.",includeOneTitle:"Two helmets",includeOneCopy:"Two standard helmets are included with each sample rental package.",includeTwoTitle:"Delivery coordination",includeTwoCopy:"Ask the team about delivery and collection coverage for your area.",includeThreeTitle:"Daily or monthly",includeThreeCopy:"Choose a short daily rental or a longer monthly plan.",includeFourTitle:"Manual confirmation",includeFourCopy:"Availability and final rental terms are confirmed by the admin before payment.",inquiryEyebrow:"Rental inquiry",inquiryTitle:"Tell us what you need.",inquiryCopy:"Select a bike and rental duration. The estimated total below is for the concept preview only; the team confirms the final rate, deposit, availability, and delivery details.",estimateLabel:"Estimated sample total",estimateDaily:n=>`${n} day${n===1?"":"s"}`,estimateMonthly:n=>`${n} month${n===1?"":"s"}`,bikeLabel:"Motorbike",planLabel:"Plan",startLabel:"Start date",durationLabel:"Duration",nameLabel:"Name",contactLabel:"WhatsApp / Email",areaLabel:"Pickup / delivery area",messageLabel:"Notes",submit:"Send rental inquiry",formNote:"Demo only. no personal data is transmitted.",sent:"Rental inquiry demo received. no data was sent.",footerCopy:"Property, long-stay living, and practical Bali mobility in one premium platform concept.",footerExplore:"Explore",footerContact:"Contact"},
    id:{navProperties:"Properti",navLongStay:"Long stay",navServices:"Layanan",navAbout:"Tentang",navFleet:"Pilihan motor",navReserve:"Tanya ketersediaan",back:"← Kembali ke Bali living",heroEyebrow:"Rental motor Bali",heroTitle:"Keliling Bali,<br>lebih fleksibel.",heroCopy:"Pilih motor praktis untuk beberapa hari atau satu bulan penuh. Bandingkan harga contoh, fasilitas yang termasuk, lalu kirim satu inquiry ketersediaan.",browseFleet:"Lihat pilihan motor",askNow:"Tanya ketersediaan",trustDaily:"Paket harian & bulanan",trustHelmets:"Termasuk 2 helm",trustDelivery:"Bisa diantar",trustManual:"Konfirmasi manual",introEyebrow:"Alur rental sederhana",introTitle:"Pilih motor. Tentukan paket. Konfirmasi dengan tim.",introCopy:"Ini masih pratinjau konsep. Inventori produksi, deposit, persyaratan pengemudi, area antar, dan tarif final dikonfirmasi manual sebelum pembayaran.",sampleRates:"Harga masih contoh",fleetEyebrow:"Pilihan motor",fleetTitle:"Pilih motor yang cocok untuk kebutuhanmu.",daily:"Harian",monthly:"Bulanan",automatic:"Matic",helmets:"2 helm",delivery:"Bisa diantar",choose:"Pilih motor ini",perDay:"/ hari",perMonth:"/ bulan",includedEyebrow:"Untuk mobilitas harian di Bali",includedTitle:"Hal penting dibuat jelas sebelum berkendara.",includedCopy:"Pengalaman rental dibuat sederhana dengan perlengkapan dasar, pilihan durasi yang jelas, serta pickup atau pengantaran yang dikonfirmasi admin.",includeOneTitle:"Dua helm",includeOneCopy:"Dua helm standar termasuk di setiap paket rental contoh.",includeTwoTitle:"Koordinasi pengantaran",includeTwoCopy:"Tanyakan ke tim mengenai cakupan area antar dan pengambilan motor.",includeThreeTitle:"Harian atau bulanan",includeThreeCopy:"Pilih rental singkat harian atau paket bulanan untuk masa tinggal lebih lama.",includeFourTitle:"Konfirmasi manual",includeFourCopy:"Ketersediaan dan ketentuan rental final dikonfirmasi admin sebelum pembayaran.",inquiryEyebrow:"Inquiry rental",inquiryTitle:"Ceritakan kebutuhanmu.",inquiryCopy:"Pilih motor dan durasi rental. Estimasi total di bawah hanya untuk pratinjau konsep; tim akan mengonfirmasi tarif final, deposit, ketersediaan, dan detail pengantaran.",estimateLabel:"Estimasi total contoh",estimateDaily:n=>`${n} hari`,estimateMonthly:n=>`${n} bulan`,bikeLabel:"Motor",planLabel:"Paket",startLabel:"Tanggal mulai",durationLabel:"Durasi",nameLabel:"Nama",contactLabel:"WhatsApp / Email",areaLabel:"Area pickup / pengantaran",messageLabel:"Catatan",submit:"Kirim inquiry rental",formNote:"Hanya demo. tidak ada data pribadi yang dikirim.",sent:"Inquiry rental demo diterima. tidak ada data yang dikirim.",footerCopy:"Properti, hunian long-stay, dan mobilitas praktis Bali dalam satu konsep platform premium.",footerExplore:"Jelajahi",footerContact:"Kontak"}
  };

  Object.assign(copy.en,{heroCopy:'Choose a motorbike for a few days or a full month. Compare listed rates and send a simple availability request.',introCopy:'Confirm availability, deposits, driver requirements, delivery coverage, and final rates with the team before payment.',sampleRates:'Rates use each listing’s currency',trustHelmets:'Equipment listed per bike',trustDelivery:'Ask about delivery',includeOneTitle:'Included equipment',includeOneCopy:'Check the equipment listed for your chosen motorbike. Confirm any additional requirements with the team.',inquiryCopy:'Select a bike and duration. The estimate uses its listed rate; the team confirms availability, deposit, and delivery details before payment.',estimateLabel:'Estimated rental total',inquiryEyebrow:'Rental ticket',submit:'Create rental ticket',formNote:'You will receive a ticket number after sending. Our team confirms availability and booking details separately.',footerCopy:'Bali property, long-stay living, and practical mobility.'});
  Object.assign(copy.id,{heroCopy:'Pilih motor untuk beberapa hari atau satu bulan penuh. Bandingkan tarif dan kirim permintaan ketersediaan.',introCopy:'Ketersediaan, deposit, persyaratan pengemudi, area antar, dan tarif final dikonfirmasi dengan tim sebelum pembayaran.',sampleRates:'Tarif mengikuti mata uang setiap listing',trustHelmets:'Perlengkapan sesuai listing',trustDelivery:'Tanyakan opsi antar',includeOneTitle:'Perlengkapan yang termasuk',includeOneCopy:'Periksa perlengkapan pada motor pilihanmu. Konfirmasikan kebutuhan tambahan dengan tim.',inquiryCopy:'Pilih motor dan durasi. Estimasi menggunakan tarif listing; tim akan mengonfirmasi ketersediaan, deposit, dan pengantaran sebelum pembayaran.',estimateLabel:'Estimasi total rental',inquiryEyebrow:'Tiket rental',submit:'Buat tiket rental',formNote:'Nomor tiket muncul setelah dikirim. Tim akan mengonfirmasi ketersediaan dan detail pemesanan.',footerCopy:'Properti, hunian long-stay, dan mobilitas praktis di Bali.'});
  function t(){return copy[language]||copy.en}
  function format(value,unit){return value==null?(language==='id'?'Hubungi tim':'Ask for a quote'):new Intl.NumberFormat(unit==='IDR'?'id-ID':'en-US',{style:'currency',currency:unit,maximumFractionDigits:unit==='IDR'?0:2}).format(value)}
  function bikeById(id){return bikes.find(b=>b.id===id)}

  function renderCopy(){
    document.documentElement.lang=language;
    document.querySelectorAll("[data-rental-i18n]").forEach(el=>{const value=t()[el.dataset.rentalI18n];if(typeof value==="string")el.innerHTML=value;});
    if(languageButton)languageButton.textContent=language.toUpperCase();
    if(currencyButton)currencyButton.textContent=currency;
  }
  function renderBikeOptions(){
    if(!bikeSelect)return;const current=bikeSelect.value;
    const available=bikes.filter(b=>b.availability==='available');
    bikeSelect.innerHTML=available.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('');
    if(available.length)bikeSelect.value=available.some(b=>b.id===current)?current:available[0].id;
    bikeSelect.disabled=!available.length;form.querySelector('[type=submit]').disabled=loading||!available.length;
  }
  function renderFleet(){
    if(!fleetGrid)return;const c=t();fleetGrid.setAttribute('aria-busy',String(loading));
    if(!bikes.length){fleetGrid.innerHTML=`<section class="rental-empty" role="status"><h3>${loading?(language==='id'?'Memuat pilihan motor…':'Loading motorbikes…'):loadError?(language==='id'?'Pilihan motor belum bisa dimuat.':'Unable to load motorbikes.'):(language==='id'?'Pilihan motor segera hadir.':'Motorbikes coming soon.')}</h3><p>${language==='id'?'Hubungi tim untuk informasi rental terbaru.':'Contact the team for the latest rental options.'}</p>${loadError?`<button id="retryFleet" type="button">${language==='id'?'Coba lagi':'Try again'}</button>`:''}</section>`;document.getElementById('retryFleet')?.addEventListener('click',loadFleet);return;}
    fleetGrid.innerHTML=bikes.map(b=>{
      const price=format(rateView==='daily'?b.daily_price:b.monthly_price,b.currency),period=rateView==='daily'?c.perDay:c.perMonth;
      const desc=b['description_'+language]||b.description_en||b.description_id;
      return `<article class="rental-bike-card"><div class="rental-bike-media"><img src="${b.image}" alt="${esc(b.name)}" loading="lazy"><span class="rental-bike-badge">${b.availability==='available'?(language==='id'?'Tersedia':'Available'):(language==='id'?'Tidak tersedia':'Unavailable')}</span></div><div class="rental-bike-body"><span class="rental-bike-meta">${b.engine_cc?b.engine_cc+' cc':''}</span><h3 class="rental-bike-title">${esc(b.name)}</h3><p class="rental-bike-desc">${esc(desc)}</p><div class="rental-bike-specs">${b.included_items.map(value=>`<span>${esc(value)}</span>`).join('')}</div><div class="rental-bike-price"><span><strong>${price}</strong><small>${period}</small></span><button class="rental-bike-select" type="button" data-bike-select="${b.id}" ${b.availability!=='available'?'disabled':''}>${c.choose}</button></div></div></article>`;
    }).join('');
    fleetGrid.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{if(!img.dataset.failed){img.dataset.failed='true';img.src=AUPCatalog.placeholder;}}));
    fleetGrid.querySelectorAll('[data-bike-select]').forEach(btn=>btn.addEventListener('click',()=>{bikeSelect.value=btn.dataset.bikeSelect;planSelect.value=rateView;updateEstimate();document.getElementById('rentalInquiry')?.scrollIntoView({behavior:'smooth',block:'start'});}));
  }
  function updateEstimate(){
    if(!estimate||!estimateNote)return;const bike=bikeById(bikeSelect?.value);if(!bike){estimate.textContent='—';estimateNote.textContent=language==='id'?'Pilih motor yang tersedia terlebih dahulu.':'Choose an available motorbike first.';return;}
    const plan=planSelect?.value||'daily',duration=Number(durationInput?.value||1),rate=plan==='daily'?bike.daily_price:bike.monthly_price;
    durationInput.max=plan==='daily'?'365':'24';
    estimate.textContent=Number.isInteger(duration)&&duration>0&&duration<=Number(durationInput.max)?format(rate==null?null:Number(rate)*duration,bike.currency):'—';
    estimateNote.textContent=`${bike.name} · ${plan==='daily'?t().estimateDaily(duration):t().estimateMonthly(duration)}`;
  }
  async function loadFleet(){loading=true;loadError=false;renderFleet();renderBikeOptions();try{const rows=await AUPCatalog.motorbikes();bikes.splice(0,bikes.length,...rows);}catch{loadError=true;}finally{loading=false;renderFleet();renderBikeOptions();updateEstimate();}}

  function showToast(message){if(!toast)return;toast.textContent=message;toast.classList.add("show");clearTimeout(window.__rentalToast);window.__rentalToast=setTimeout(()=>toast.classList.remove("show"),2600)}

  document.querySelectorAll("[data-rate-view]").forEach(btn=>btn.addEventListener("click",()=>{rateView=btn.dataset.rateView;document.querySelectorAll("[data-rate-view]").forEach(b=>b.classList.toggle("is-active",b===btn));renderFleet();}));
  languageButton?.addEventListener("click",()=>{language=language==="en"?"id":"en";localStorage.setItem("aup-language",language);renderCopy();renderBikeOptions();renderFleet();updateEstimate();});
  currencyButton?.addEventListener("click",()=>{currency=currency==="USD"?"IDR":"USD";localStorage.setItem("aup-currency",currency);renderCopy();renderFleet();updateEstimate();});
  menuButton?.addEventListener("click",()=>{const open=menuButton.getAttribute("aria-expanded")==="true";menuButton.setAttribute("aria-expanded",String(!open));mobileMenu?.classList.toggle("open",!open);});
  mobileMenu?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{mobileMenu.classList.remove("open");menuButton?.setAttribute("aria-expanded","false");}));
  bikeSelect?.addEventListener("change",updateEstimate);
  planSelect?.addEventListener("change",()=>{rateView=planSelect.value;document.querySelectorAll("[data-rate-view]").forEach(b=>b.classList.toggle("is-active",b.dataset.rateView===rateView));renderFleet();updateEstimate();});
  durationInput?.addEventListener("input",updateEstimate);
  AUPInquiry.bind(form,fields=>{
    const bike=bikeById(fields.get('bike'));if(!bike||bike.availability!=='available')throw Error('UNAVAILABLE');
    const contact=String(fields.get('contact')||'').trim();
    return {inquiry_type:'motorbike',motorbike_id:bike.id,plan:String(fields.get('plan')),duration:Number(fields.get('duration')),start:String(fields.get('start')||''),area:String(fields.get('area')||''),message:String(fields.get('message')||'').trim()||(language==='id'?'Mohon konfirmasi ketersediaan motor ini.':'Please confirm availability for this motorbike.'),email:contact.includes('@')?contact:'',phone:contact.includes('@')?'':contact};
  },()=>{renderBikeOptions();updateEstimate();});


  const dateInput=document.getElementById('rentalStart');if(dateInput)dateInput.min=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
  renderCopy();renderBikeOptions();renderFleet();updateEstimate();loadFleet();
})();