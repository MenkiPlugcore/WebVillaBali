const WISHLIST_KEY = "aup-saved-properties-v1";

(function ensureWishlistStyles(){
  if(document.querySelector('link[href="wishlist.css"]')) return;
  const link=document.createElement("link");
  link.rel="stylesheet"; link.href="wishlist.css";
  document.head.appendChild(link);
})();

const properties = [
  {id:1,slug:"jungle-residence-ubud",title:"Jungle Residence Ubud",location:"Ubud",type:"Villa",purpose:"sale",usd:485000,idr:7625000000,priceSuffix:"freehold",beds:4,baths:4,area:"420 m²",featured:true,image:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=88"},
  {id:2,slug:"canggu-courtyard-villa",title:"Canggu Courtyard Villa",location:"Canggu",type:"Villa",purpose:"rent",usd:3200,idr:50300000,priceSuffix:"month",beds:3,baths:3,area:"280 m²",featured:true,image:"https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=88"},
  {id:3,slug:"uluwatu-ocean-land",title:"Uluwatu Ocean Land",location:"Uluwatu",type:"Land",purpose:"sale",usd:295000,idr:4640000000,priceSuffix:"leasehold",beds:null,baths:null,area:"1,200 m²",featured:false,image:"https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=88"},
  {id:4,slug:"sanur-garden-house",title:"Sanur Garden House",location:"Sanur",type:"House",purpose:"sale",usd:355000,idr:5580000000,priceSuffix:"freehold",beds:3,baths:3,area:"310 m²",featured:false,image:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=88"},
  {id:5,slug:"seminyak-long-stay-loft",title:"Seminyak Long-Stay Loft",location:"Seminyak",type:"Rental",purpose:"rent",usd:1800,idr:28300000,priceSuffix:"month",beds:2,baths:2,area:"150 m²",featured:false,image:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=88"},
  {id:6,slug:"ubud-creative-compound",title:"Ubud Creative Compound",location:"Ubud",type:"Commercial",purpose:"sale",usd:610000,idr:9590000000,priceSuffix:"leasehold",beds:null,baths:4,area:"680 m²",featured:false,image:"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=88"}
];

const translations = {
  en: {
    navProperties:"Properties", navLocations:"Locations", navServices:"Services", navAbout:"About", talkToUs:"Talk to us",
    heroEyebrow:"Bali property, curated with purpose", heroTitle:"Find your place<br>in Bali.", heroCopy:"From private villas and long-term rentals to land and commercial opportunities — discover properties selected for living, investing and building your next chapter.",
    searchLocationLabel:"Location", allBali:"All Bali", searchTypeLabel:"Property type", allTypes:"All types", searchPurposeLabel:"Purpose", saleAndRent:"Sale & Rent", forSale:"For sale", forRent:"For rent", searchButton:"Search properties",
    trustOne:"Local market knowledge", trustTwo:"International-ready service", trustThree:"Transparent inquiry process",
    selectedProperties:"Selected properties", curatedForYou:"Curated for the way you want to live.", propertyIntro:"Browse a growing collection of villas, homes, land and investment opportunities across Bali.", filterAll:"All",
    noResultsTitle:"No matching properties.", noResultsCopy:"Try another location or property type.",
    exploreByType:"Explore by type", propertyForEveryPlan:"A property for every plan.", catVilla:"Private stays, residences and investment villas.", catLand:"Strategic plots for building and long-term value.", catHome:"Comfortable homes for families and long-term living.", catCommercial:"Spaces built for business, hospitality and growth.",
    discoverBali:"Discover Bali", locationTitle:"Choose the neighbourhood that fits your story.", viewProperties:"View properties →", ubudText:"Culture · Nature · Wellness", cangguText:"Lifestyle · Surf · Dining", uluwatuText:"Cliffs · Ocean · Luxury",
    moreThanListings:"More than listings", serviceTitle:"A clear path from discovery to decision.", serviceCopy:"We help buyers, renters and investors navigate Bali property with a straightforward inquiry process and local support.", startInquiry:"Start an inquiry",
    serviceOneTitle:"Property discovery", serviceOneText:"Shortlist options around your location, budget and purpose.", serviceTwoTitle:"Private inquiry", serviceTwoText:"Ask questions, schedule viewings and verify property details.", serviceThreeTitle:"Payment coordination", serviceThreeText:"Manual payment coordination through PayPal when applicable.",
    trustEyebrow:"Built for long-term trust", trustTitle:"Built to become the place hundreds of owners trust with their property.", trustCopy:"Premium presentation, direct inquiries, and international-ready communication help every listing feel represented with care — whether it is a villa, home, land, rental, or commercial space.", listProperty:"List your property", seeExperience:"See the experience",
    ownerPointOneTitle:"Premium presentation", ownerPointOneText:"A polished listing format designed to make each property easier to understand and remember.", ownerPointTwoTitle:"International-ready", ownerPointTwoText:"English and Indonesian presentation with USD and IDR support for local and overseas audiences.", ownerPointThreeTitle:"Direct inquiry flow", ownerPointThreeText:"Keep the path from discovery to conversation simple, clear, and owner-friendly.",
    reviewEyebrow:"Sample client stories", reviewTitle:"What a great property experience should feel like.", reviewNote:"Concept preview testimonials. Replace these with verified client reviews before the public launch.", sampleBadge:"Sample",
    reviewOne:"“The listing felt more premium, and it was much easier to share the property with serious prospects.”", reviewOneName:"Villa owner", reviewOneMeta:"Ubud · Property owner",
    reviewTwo:"“The English presentation gave the property a much more international feel when we shared it overseas.”", reviewTwoName:"Property owner", reviewTwoMeta:"Canggu · Rental property",
    reviewThree:"“Clear photos, details, and inquiry steps made it easier to understand the property before arranging a viewing.”", reviewThreeName:"International buyer", reviewThreeMeta:"Australia · Bali property search",
    aboutEyebrow:"Agung Ubud Property", aboutTitle:"Local perspective.<br>Global standard.", aboutCopy:"A premium property platform concept designed to connect local opportunities with buyers, renters and investors from around the world.",
    contactEyebrow:"Let’s find your Bali property", contactTitle:"Tell us what you’re looking for.", contactCopy:"This demo uses a manual inquiry flow. In production, inquiries can be connected to WhatsApp, email, CRM and PayPal payment instructions.", nameLabel:"Name", emailLabel:"Email", interestLabel:"I’m interested in", messageLabel:"Message", sendInquiry:"Send inquiry", demoNote:"Demo only — no personal data is transmitted.",
    footerTagline:"Premium Bali property for living, renting and investing.", footerExplore:"Explore", footerCompany:"Company", footerContact:"Contact", contactLink:"Contact", privacyLink:"Privacy",
    viewDetails:"View details →", featured:"Featured", bedrooms:"beds", bathrooms:"baths", month:"/ month", freehold:"Freehold", leasehold:"Leasehold", inquiryToast:"Demo inquiry received — no data was sent.",
    saved:"Saved", save:"Save", savedNow:"Property saved to your shortlist.", removedSaved:"Property removed from your shortlist."
  },
  id: {
    navProperties:"Properti", navLocations:"Lokasi", navServices:"Layanan", navAbout:"Tentang", talkToUs:"Hubungi kami",
    heroEyebrow:"Properti Bali, dikurasi dengan tujuan", heroTitle:"Temukan tempatmu<br>di Bali.", heroCopy:"Mulai dari vila privat dan sewa jangka panjang hingga tanah serta properti komersial — temukan pilihan untuk hunian, investasi, dan rencana berikutnya.",
    searchLocationLabel:"Lokasi", allBali:"Seluruh Bali", searchTypeLabel:"Jenis properti", allTypes:"Semua jenis", searchPurposeLabel:"Tujuan", saleAndRent:"Jual & Sewa", forSale:"Dijual", forRent:"Disewa", searchButton:"Cari properti",
    trustOne:"Wawasan pasar lokal", trustTwo:"Layanan siap internasional", trustThree:"Proses inquiry transparan",
    selectedProperties:"Properti pilihan", curatedForYou:"Dikurasi untuk cara hidup yang kamu inginkan.", propertyIntro:"Jelajahi koleksi vila, rumah, tanah, dan peluang investasi di berbagai area Bali.", filterAll:"Semua",
    noResultsTitle:"Properti tidak ditemukan.", noResultsCopy:"Coba lokasi atau jenis properti lain.",
    exploreByType:"Jelajahi berdasarkan jenis", propertyForEveryPlan:"Properti untuk setiap rencana.", catVilla:"Vila privat untuk hunian, liburan, dan investasi.", catLand:"Tanah strategis untuk pembangunan dan nilai jangka panjang.", catHome:"Hunian nyaman untuk keluarga dan tinggal jangka panjang.", catCommercial:"Ruang untuk bisnis, hospitality, dan pertumbuhan.",
    discoverBali:"Jelajahi Bali", locationTitle:"Pilih kawasan yang sesuai dengan ceritamu.", viewProperties:"Lihat properti →", ubudText:"Budaya · Alam · Wellness", cangguText:"Lifestyle · Surf · Kuliner", uluwatuText:"Tebing · Laut · Mewah",
    moreThanListings:"Lebih dari sekadar listing", serviceTitle:"Jalur yang jelas dari pencarian hingga keputusan.", serviceCopy:"Kami membantu pembeli, penyewa, dan investor menavigasi properti Bali melalui proses inquiry yang jelas dan dukungan lokal.", startInquiry:"Mulai inquiry",
    serviceOneTitle:"Pencarian properti", serviceOneText:"Temukan opsi berdasarkan lokasi, anggaran, dan kebutuhanmu.", serviceTwoTitle:"Inquiry privat", serviceTwoText:"Ajukan pertanyaan, jadwalkan viewing, dan verifikasi detail properti.", serviceThreeTitle:"Koordinasi pembayaran", serviceThreeText:"Koordinasi pembayaran manual melalui PayPal bila diperlukan.",
    trustEyebrow:"Dibangun untuk kepercayaan jangka panjang", trustTitle:"Dibangun untuk menjadi tempat yang dipercaya ratusan pemilik dalam memperkenalkan propertinya.", trustCopy:"Presentasi premium, inquiry langsung, dan komunikasi yang siap untuk pasar internasional membuat setiap listing tampil lebih terawat — mulai dari vila, rumah, tanah, sewa, hingga properti komersial.", listProperty:"Daftarkan properti", seeExperience:"Lihat pengalamannya",
    ownerPointOneTitle:"Presentasi premium", ownerPointOneText:"Format listing yang rapi agar setiap properti lebih mudah dipahami, dibandingkan, dan diingat.", ownerPointTwoTitle:"Siap internasional", ownerPointTwoText:"Tampilan Bahasa Indonesia dan Inggris dengan dukungan USD serta IDR untuk audiens lokal maupun luar negeri.", ownerPointThreeTitle:"Alur inquiry langsung", ownerPointThreeText:"Jalur dari menemukan properti sampai memulai percakapan dibuat sederhana, jelas, dan nyaman untuk pemilik.",
    reviewEyebrow:"Contoh cerita klien", reviewTitle:"Seperti inilah pengalaman properti yang ingin kami bangun.", reviewNote:"Testimoni contoh untuk pratinjau konsep. Ganti dengan ulasan klien terverifikasi sebelum peluncuran publik.", sampleBadge:"Contoh",
    reviewOne:"“Listing terasa jauh lebih premium dan properti jadi lebih mudah dibagikan kepada calon peminat yang serius.”", reviewOneName:"Pemilik vila", reviewOneMeta:"Ubud · Pemilik properti",
    reviewTwo:"“Presentasi bahasa Inggris membuat properti terasa lebih siap ketika kami membagikannya ke calon penyewa dari luar negeri.”", reviewTwoName:"Pemilik properti", reviewTwoMeta:"Canggu · Properti sewa",
    reviewThree:"“Foto, detail, dan alur inquiry yang jelas membuat properti lebih mudah dipahami sebelum menjadwalkan viewing.”", reviewThreeName:"Calon pembeli internasional", reviewThreeMeta:"Australia · Pencarian properti Bali",
    aboutEyebrow:"Agung Ubud Property", aboutTitle:"Perspektif lokal.<br>Standar global.", aboutCopy:"Konsep platform properti premium untuk menghubungkan peluang lokal dengan pembeli, penyewa, dan investor dari berbagai negara.",
    contactEyebrow:"Temukan properti Bali kamu", contactTitle:"Ceritakan properti yang kamu cari.", contactCopy:"Demo ini menggunakan alur inquiry manual. Pada versi produksi, inquiry dapat dihubungkan ke WhatsApp, email, CRM, dan instruksi pembayaran PayPal.", nameLabel:"Nama", emailLabel:"Email", interestLabel:"Saya tertarik dengan", messageLabel:"Pesan", sendInquiry:"Kirim inquiry", demoNote:"Hanya demo — tidak ada data pribadi yang dikirim.",
    footerTagline:"Properti premium Bali untuk tinggal, menyewa, dan berinvestasi.", footerExplore:"Jelajahi", footerCompany:"Perusahaan", footerContact:"Kontak", contactLink:"Kontak", privacyLink:"Privasi",
    viewDetails:"Lihat detail →", featured:"Pilihan", bedrooms:"kamar", bathrooms:"km mandi", month:"/ bulan", freehold:"Hak milik", leasehold:"Leasehold", inquiryToast:"Inquiry demo diterima — tidak ada data yang dikirim.",
    saved:"Tersimpan", save:"Simpan", savedNow:"Properti disimpan ke daftar pilihanmu.", removedSaved:"Properti dihapus dari daftar pilihanmu."
  }
};

let language = localStorage.getItem("aup-language") || "en";
let currency = localStorage.getItem("aup-currency") || "USD";
let activeType = "all";
let searchFilters = {location:"all", type:"all", purpose:"all"};
let initializing = true;
let revealObserver = null;

const propertyGrid = document.getElementById("propertyGrid");
const emptyState = document.getElementById("emptyState");
const languageToggle = document.getElementById("languageToggle");
const currencyToggle = document.getElementById("currencyToggle");
const toast = document.getElementById("toast");

function readSaved(){
  try { const parsed=JSON.parse(localStorage.getItem(WISHLIST_KEY)||"[]"); return Array.isArray(parsed)?parsed:[]; }
  catch { return []; }
}
function writeSaved(items){ localStorage.setItem(WISHLIST_KEY,JSON.stringify(items)); }
function isSaved(slug){ return readSaved().some(item=>item.slug===slug); }
function toggleSavedProperty(property){
  const items=readSaved();
  const index=items.findIndex(item=>item.slug===property.slug);
  let nowSaved=false;
  if(index>=0) items.splice(index,1);
  else { items.push({...property}); nowSaved=true; }
  writeSaved(items);
  updateSavedCount();
  updateWishlistButtons();
  showToast(translations[language][nowSaved?"savedNow":"removedSaved"]);
}
function injectSavedNav(){
  const actions=document.querySelector(".header-actions");
  if(actions && !actions.querySelector(".saved-nav-link")){
    const a=document.createElement("a");
    a.className="saved-nav-link"; a.href="saved.html";
    a.innerHTML='<span class="saved-nav-heart">♡</span><span class="saved-nav-label"></span><span class="saved-count">0</span>';
    const languageButton=actions.querySelector("#languageToggle");
    actions.insertBefore(a,languageButton||actions.firstChild);
  }
  const mobile=document.getElementById("mobileMenu");
  if(mobile && !mobile.querySelector('[href="saved.html"]')){
    const a=document.createElement("a"); a.href="saved.html"; a.className="mobile-saved-link";
    mobile.appendChild(a);
  }
  updateSavedCount();
}
function updateSavedCount(){
  const count=readSaved().length;
  document.querySelectorAll(".saved-count").forEach(el=>el.textContent=count);
  document.querySelectorAll(".saved-nav-label,.mobile-saved-link").forEach(el=>el.textContent=translations[language].saved);
}
function updateWishlistButtons(){
  document.querySelectorAll("[data-save-slug]").forEach(btn=>{
    const saved=isSaved(btn.dataset.saveSlug);
    btn.classList.toggle("is-saved",saved);
    btn.setAttribute("aria-pressed",String(saved));
    btn.setAttribute("aria-label",`${saved?translations[language].saved:translations[language].save}: ${btn.dataset.saveTitle||"property"}`);
  });
}

function money(p) { return currency === "USD" ? `$${p.usd.toLocaleString("en-US")}` : `Rp ${p.idr.toLocaleString("id-ID")}`; }
function suffix(p) { const t=translations[language]; if(p.priceSuffix==="month")return t.month; if(p.priceSuffix==="freehold")return t.freehold; return t.leasehold; }
function isVisible(p) {
  return (activeType === "all" || p.type === activeType) &&
    (searchFilters.location === "all" || p.location === searchFilters.location) &&
    (searchFilters.type === "all" || p.type === searchFilters.type) &&
    (searchFilters.purpose === "all" || p.purpose === searchFilters.purpose);
}

function renderSkeletons(count = 6) {
  if (!propertyGrid) return;
  propertyGrid.innerHTML = Array.from({length:count}, () => `
    <article class="skeleton-card" aria-hidden="true"><div class="skeleton-media"></div><div class="skeleton-body"><div class="skeleton-line sm"></div><div class="skeleton-line lg"></div><div class="skeleton-line md"></div></div></article>`).join("");
}
function hydrateCardImages() {
  propertyGrid?.querySelectorAll(".property-image[data-bg]").forEach(el => {
    const image = new Image();
    const done = () => el.classList.remove("image-loading");
    image.onload = () => { el.style.backgroundImage = `url('${el.dataset.bg}')`; done(); };
    image.onerror = done; image.src = el.dataset.bg;
  });
}
function renderProperties() {
  if (!propertyGrid) return;
  const t=translations[language];
  const visible=properties.filter(isVisible);
  propertyGrid.innerHTML=visible.map(p=>`
    <article class="property-card reveal-item">
      <button class="save-property-btn${isSaved(p.slug)?" is-saved":""}" type="button" data-save-slug="${p.slug}" data-save-title="${p.title}" aria-pressed="${isSaved(p.slug)}" aria-label="${isSaved(p.slug)?t.saved:t.save}: ${p.title}"><span class="heart-empty">♡</span><span class="heart-filled">♥</span></button>
      <a class="property-image image-loading" href="properties/${p.slug}.html" data-bg="${p.image}" aria-label="${p.title}"><div class="property-badges">${p.featured?`<span class="property-badge featured">${t.featured}</span>`:""}<span class="property-badge">${p.purpose==="sale"?t.forSale:t.forRent}</span></div></a>
      <div class="property-body"><span class="property-location">${p.location} · ${p.type}</span><div class="property-title-row"><h3>${p.title}</h3><div class="property-price">${money(p)}<small>${suffix(p)}</small></div></div><div class="property-specs">${p.beds?`<span>${p.beds} ${t.bedrooms}</span>`:""}${p.baths?`<span>${p.baths} ${t.bathrooms}</span>`:""}<span>${p.area}</span></div><button type="button" data-property-url="properties/${p.slug}.html">${t.viewDetails}</button></div>
    </article>`).join("");
  emptyState.hidden=visible.length!==0;
  propertyGrid.querySelectorAll("[data-property-url]").forEach(btn=>btn.addEventListener("click",()=>window.location.href=btn.dataset.propertyUrl));
  propertyGrid.querySelectorAll("[data-save-slug]").forEach(btn=>btn.addEventListener("click",event=>{
    event.preventDefault(); event.stopPropagation();
    const property=properties.find(p=>p.slug===btn.dataset.saveSlug); if(property)toggleSavedProperty(property);
  }));
  hydrateCardImages(); observeReveals(propertyGrid); updateWishlistButtons();
}

function applyLanguage({render=true}={}) {
  const t=translations[language];
  document.documentElement.lang=language;
  document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(t[key])el.innerHTML=t[key];});
  if(languageToggle)languageToggle.textContent=language.toUpperCase();
  updateSavedCount(); updateWishlistButtons();
  if(render&&!initializing)renderProperties();
}
function showToast(message){ if(!toast)return; toast.textContent=message; toast.classList.add("show"); clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>toast.classList.remove("show"),2800); }
function initRevealObserver(){
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced||!("IntersectionObserver" in window)){document.querySelectorAll(".reveal-item").forEach(el=>el.classList.add("reveal-visible"));return;}
  revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add("reveal-visible");revealObserver.unobserve(entry.target);}),{threshold:.1,rootMargin:"0px 0px -35px 0px"});
  observeReveals(document);
}
function observeReveals(root){
  const candidates=[]; if(root?.matches?.(".reveal-item"))candidates.push(root); root?.querySelectorAll?.(".reveal-item").forEach(el=>candidates.push(el));
  candidates.forEach(el=>{if(el.dataset.revealBound)return;el.dataset.revealBound="true";if(revealObserver)revealObserver.observe(el);else el.classList.add("reveal-visible");});
}
function finishInitialLoad(){ if(!initializing)return; initializing=false; clearTimeout(window.__propertySkeletonTimer); renderProperties(); }

injectSavedNav();
languageToggle?.addEventListener("click",()=>{language=language==="en"?"id":"en";localStorage.setItem("aup-language",language);applyLanguage({render:!initializing});});
currencyToggle?.addEventListener("click",()=>{currency=currency==="USD"?"IDR":"USD";localStorage.setItem("aup-currency",currency);currencyToggle.textContent=currency;if(initializing)finishInitialLoad();else renderProperties();});
document.querySelectorAll(".filter-chip").forEach(chip=>chip.addEventListener("click",()=>{document.querySelectorAll(".filter-chip").forEach(c=>c.classList.remove("active"));chip.classList.add("active");activeType=chip.dataset.filter;if(initializing)finishInitialLoad();else renderProperties();}));
document.getElementById("heroSearch")?.addEventListener("submit",event=>{event.preventDefault();searchFilters={location:document.getElementById("locationFilter").value,type:document.getElementById("typeFilter").value,purpose:document.getElementById("purposeFilter").value};activeType="all";document.querySelectorAll(".filter-chip").forEach(c=>c.classList.toggle("active",c.dataset.filter==="all"));if(initializing)finishInitialLoad();else renderProperties();document.getElementById("properties")?.scrollIntoView({behavior:"smooth"});});
const menuButton=document.getElementById("menuButton"); const mobileMenu=document.getElementById("mobileMenu");
menuButton?.addEventListener("click",()=>{const open=menuButton.getAttribute("aria-expanded")==="true";menuButton.setAttribute("aria-expanded",String(!open));mobileMenu?.classList.toggle("open",!open);});
mobileMenu?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{mobileMenu.classList.remove("open");menuButton?.setAttribute("aria-expanded","false");}));
document.getElementById("contactForm")?.addEventListener("submit",event=>{event.preventDefault();showToast(translations[language].inquiryToast);event.currentTarget.reset();});

renderSkeletons(); applyLanguage({render:false}); if(currencyToggle)currencyToggle.textContent=currency; initRevealObserver(); window.__propertySkeletonTimer=setTimeout(finishInitialLoad,520);
window.addEventListener("storage",()=>{updateSavedCount();updateWishlistButtons();});

/* Property Map View — lazy-load Leaflet only when the visitor opens the map. */
(() => {
  const filterRow=document.getElementById("filterRow");
  if(!filterRow||!propertyGrid) return;

  const coordinates={
    "jungle-residence-ubud":[-8.5062,115.2628],
    "canggu-courtyard-villa":[-8.6486,115.1386],
    "uluwatu-ocean-land":[-8.8229,115.0862],
    "sanur-garden-house":[-8.7048,115.2626],
    "seminyak-long-stay-loft":[-8.6905,115.1669],
    "ubud-creative-compound":[-8.5190,115.2720]
  };
  const mapCopy={
    en:{list:"List",map:"Map",privacy:"Pins show approximate areas for privacy. Exact addresses are shared during a verified inquiry.",result:n=>`${n} ${n===1?"property":"properties"} on map`,resultsTitle:"Map results",resultsSub:"Select a property to focus the map",forSale:"For sale",forRent:"For rent",beds:"beds",baths:"baths",view:"View details",loading:"Loading Bali map…",unavailableTitle:"Map temporarily unavailable",unavailableText:"The map service could not load. You can continue browsing properties in list view.",noResults:"No properties on this map",noResultsText:"Try changing the location, property type, or purpose filters."},
    id:{list:"Daftar",map:"Peta",privacy:"Pin menampilkan area perkiraan untuk menjaga privasi. Alamat tepat dibagikan saat inquiry terverifikasi.",result:n=>`${n} properti di peta`,resultsTitle:"Hasil di peta",resultsSub:"Pilih properti untuk fokus ke lokasi",forSale:"Dijual",forRent:"Disewa",beds:"kamar",baths:"km mandi",view:"Lihat detail",loading:"Memuat peta Bali…",unavailableTitle:"Peta sementara tidak tersedia",unavailableText:"Layanan peta gagal dimuat. Kamu tetap bisa melihat properti melalui tampilan daftar.",noResults:"Tidak ada properti di peta",noResultsText:"Coba ubah filter lokasi, jenis properti, atau tujuan."}
  };

  let viewMode="list";
  let map=null;
  let markersLayer=null;
  let leafletPromise=null;
  let activeSlug=null;
  const markerBySlug=new Map();

  function c(){return mapCopy[language]||mapCopy.en}
  function ensureMapStyles(){
    if(document.querySelector('link[href="map.css"]')) return;
    const link=document.createElement("link");link.rel="stylesheet";link.href="map.css";document.head.appendChild(link);
  }
  function iconSvg(kind){
    return kind==="map"
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zm0 0V3m6 18V6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }
  function injectMapUi(){
    ensureMapStyles();
    if(filterRow.querySelector(".listing-view-switch")) return;
    const switcher=document.createElement("div");switcher.className="listing-view-switch";switcher.setAttribute("role","group");switcher.setAttribute("aria-label","Property view");
    switcher.innerHTML=`<button class="listing-view-btn is-active" id="listViewButton" type="button">${iconSvg("list")}<span></span></button><button class="listing-view-btn" id="mapViewButton" type="button">${iconSvg("map")}<span></span></button>`;
    filterRow.appendChild(switcher);

    const panel=document.createElement("div");panel.className="property-map-view";panel.id="propertyMapView";panel.hidden=true;
    panel.innerHTML=`<div class="map-view-meta"><span class="map-privacy-note" id="mapPrivacyNote"></span><span class="map-result-count" id="mapResultCount"></span></div><div class="property-map-shell" id="propertyMapShell"><div class="map-loading" id="mapLoading"><div class="map-loading-inner"><div class="map-loader"></div><span id="mapLoadingText"></span></div></div><div class="map-property-list" id="mapPropertyList" hidden></div></div>`;
    filterRow.insertAdjacentElement("afterend",panel);

    document.getElementById("listViewButton")?.addEventListener("click",()=>setViewMode("list"));
    document.getElementById("mapViewButton")?.addEventListener("click",()=>setViewMode("map"));
    updateMapCopy();
  }

  function updateMapCopy(){
    const copy=c();
    const listLabel=document.querySelector("#listViewButton span");if(listLabel)listLabel.textContent=copy.list;
    const mapLabel=document.querySelector("#mapViewButton span");if(mapLabel)mapLabel.textContent=copy.map;
    const privacy=document.getElementById("mapPrivacyNote");if(privacy)privacy.textContent=copy.privacy;
    const loading=document.getElementById("mapLoadingText");if(loading)loading.textContent=copy.loading;
    if(viewMode==="map"&&map) renderMapResults();
  }

  function setViewMode(mode){
    if(mode===viewMode) return;
    viewMode=mode;
    const panel=document.getElementById("propertyMapView");
    const listBtn=document.getElementById("listViewButton");
    const mapBtn=document.getElementById("mapViewButton");
    listBtn?.classList.toggle("is-active",mode==="list");
    mapBtn?.classList.toggle("is-active",mode==="map");
    listBtn?.setAttribute("aria-pressed",String(mode==="list"));
    mapBtn?.setAttribute("aria-pressed",String(mode==="map"));
    propertyGrid.hidden=mode==="map";
    if(emptyState) emptyState.hidden=mode==="map"?true:properties.filter(isVisible).length!==0;
    if(panel) panel.hidden=mode!=="map";
    if(mode==="map") openMap();
  }

  function loadLeaflet(){
    if(window.L) return Promise.resolve(window.L);
    if(leafletPromise) return leafletPromise;
    leafletPromise=new Promise((resolve,reject)=>{
      if(!document.getElementById("aupLeafletCss")){
        const css=document.createElement("link");css.id="aupLeafletCss";css.rel="stylesheet";css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(css);
      }
      const existing=document.getElementById("aupLeafletJs");
      if(existing){existing.addEventListener("load",()=>resolve(window.L),{once:true});existing.addEventListener("error",reject,{once:true});return;}
      const script=document.createElement("script");script.id="aupLeafletJs";script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";script.async=true;script.onload=()=>window.L?resolve(window.L):reject(new Error("Leaflet unavailable"));script.onerror=reject;document.head.appendChild(script);
    });
    return leafletPromise;
  }

  async function openMap(){
    updateMapCopy();
    const loading=document.getElementById("mapLoading");if(loading)loading.hidden=false;
    try{
      await loadLeaflet();
      initMap();
      renderMapResults();
      requestAnimationFrame(()=>map?.invalidateSize());
    }catch(error){showMapError();}
  }

  function initMap(){
    if(map||!window.L) return;
    const shell=document.getElementById("propertyMapShell");
    const loading=document.getElementById("mapLoading");
    if(loading) loading.remove();
    const mapEl=document.createElement("div");mapEl.id="propertyMap";
    const list=document.getElementById("mapPropertyList");
    shell?.insertBefore(mapEl,list||null);
    if(list) list.hidden=false;
    map=L.map(mapEl,{zoomControl:true,scrollWheelZoom:false,preferCanvas:true,attributionControl:true}).setView([-8.52,115.18],10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,detectRetina:true,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
    markersLayer=L.layerGroup().addTo(map);
    map.on("popupclose",()=>setActiveMarker(null));
  }

  function showMapError(){
    const shell=document.getElementById("propertyMapShell");if(!shell)return;
    const copy=c();
    shell.innerHTML=`<div class="map-error"><div class="map-error-inner"><h3>${copy.unavailableTitle}</h3><p>${copy.unavailableText}</p></div></div>`;
  }

  function compactPrice(p){
    if(currency==="USD"){
      const n=p.usd;if(n>=1000000)return `$${(n/1000000).toFixed(n%1000000?1:0)}M`;if(n>=1000)return `$${(n/1000).toFixed(n%1000?1:0)}k`;return `$${n}`;
    }
    const n=p.idr;if(n>=1000000000)return `Rp${(n/1000000000).toFixed(1).replace(/\.0$/,"")}B`;if(n>=1000000)return `Rp${(n/1000000).toFixed(n%1000000?1:0)}M`;return `Rp${n}`;
  }

  function popupHtml(p){
    const copy=c();
    const specs=[p.beds?`${p.beds} ${copy.beds}`:"",p.baths?`${p.baths} ${copy.baths}`:"",p.area].filter(Boolean).map(x=>`<span>${x}</span>`).join("");
    return `<div class="aup-map-popup"><div class="aup-map-popup-image" style="background-image:url('${p.image}')"></div><div class="aup-map-popup-body"><div class="aup-map-popup-meta">${p.location} · ${p.type} · ${p.purpose==="sale"?copy.forSale:copy.forRent}</div><div class="aup-map-popup-title">${p.title}</div><div class="aup-map-popup-price">${money(p)} <small>${suffix(p)}</small></div><div class="aup-map-popup-specs">${specs}</div><a class="aup-map-popup-link" href="properties/${p.slug}.html">${copy.view} →</a></div></div>`;
  }

  function setActiveMarker(slug){
    activeSlug=slug;
    markerBySlug.forEach((marker,key)=>marker.getElement()?.classList.toggle("is-active",key===slug));
    document.querySelectorAll(".map-list-card").forEach(card=>card.classList.toggle("is-active",card.dataset.mapSlug===slug));
  }

  function focusProperty(slug,{openPopup=true}={}){
    const marker=markerBySlug.get(slug);if(!marker||!map)return;
    setActiveMarker(slug);
    map.flyTo(marker.getLatLng(),Math.max(map.getZoom(),13),{duration:.55});
    if(openPopup)setTimeout(()=>marker.openPopup(),220);
  }

  function renderSideList(items){
    const list=document.getElementById("mapPropertyList");if(!list)return;
    const copy=c();
    if(!items.length){list.innerHTML=`<div class="map-no-results"><div class="map-empty-inner"><h3>${copy.noResults}</h3><p>${copy.noResultsText}</p></div></div>`;return;}
    list.innerHTML=`<div class="map-list-head"><strong>${copy.resultsTitle}</strong><small>${copy.resultsSub}</small></div>${items.map(p=>`<button class="map-list-card" type="button" data-map-slug="${p.slug}"><span class="map-list-image" style="background-image:url('${p.image}')"></span><span class="map-list-body"><span class="map-list-meta">${p.location} · ${p.type}</span><span class="map-list-title">${p.title}</span><span class="map-list-price">${money(p)} <small>${suffix(p)}</small></span></span></button>`).join("")}`;
    list.querySelectorAll("[data-map-slug]").forEach(card=>card.addEventListener("click",()=>focusProperty(card.dataset.mapSlug)));
  }

  function renderMapResults(){
    if(viewMode!=="map"||!map||!markersLayer) return;
    const visible=properties.filter(isVisible);
    const count=document.getElementById("mapResultCount");if(count)count.textContent=c().result(visible.length);
    const privacy=document.getElementById("mapPrivacyNote");if(privacy)privacy.textContent=c().privacy;
    markersLayer.clearLayers();markerBySlug.clear();activeSlug=null;
    renderSideList(visible);
    if(!visible.length){map.setView([-8.52,115.18],9);return;}
    const bounds=[];
    visible.forEach(p=>{
      const coord=coordinates[p.slug];if(!coord)return;
      const icon=L.divIcon({className:"aup-price-marker",html:`<span>${compactPrice(p)}</span>`,iconSize:[1,1],iconAnchor:[0,0]});
      const marker=L.marker(coord,{icon,title:p.title}).bindPopup(popupHtml(p),{maxWidth:260,closeButton:true,offset:[0,-8]});
      marker.on("click",()=>{setActiveMarker(p.slug)});
      marker.addTo(markersLayer);markerBySlug.set(p.slug,marker);bounds.push(coord);
    });
    if(bounds.length===1)map.setView(bounds[0],13);else if(bounds.length>1)map.fitBounds(bounds,{padding:[50,50],maxZoom:12});
    requestAnimationFrame(()=>map.invalidateSize());
  }

  function refreshIfMap(){
    updateMapCopy();
    if(viewMode==="map"){
      if(emptyState)emptyState.hidden=true;
      renderMapResults();
    }
  }

  injectMapUi();
  document.querySelectorAll(".filter-chip").forEach(btn=>btn.addEventListener("click",()=>setTimeout(refreshIfMap,0)));
  document.getElementById("heroSearch")?.addEventListener("submit",()=>setTimeout(refreshIfMap,0));
  languageToggle?.addEventListener("click",()=>setTimeout(refreshIfMap,0));
  currencyToggle?.addEventListener("click",()=>setTimeout(refreshIfMap,0));
  window.addEventListener("resize",()=>{if(viewMode==="map"&&map)requestAnimationFrame(()=>map.invalidateSize())});
  window.addEventListener("storage",refreshIfMap);
})();
