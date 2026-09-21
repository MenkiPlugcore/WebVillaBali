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
    viewDetails:"View details →", featured:"Featured", bedrooms:"beds", bathrooms:"baths", month:"/ month", freehold:"Freehold", leasehold:"Leasehold", inquiryToast:"Demo inquiry received — no data was sent."
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
    viewDetails:"Lihat detail →", featured:"Pilihan", bedrooms:"kamar", bathrooms:"km mandi", month:"/ bulan", freehold:"Hak milik", leasehold:"Leasehold", inquiryToast:"Inquiry demo diterima — tidak ada data yang dikirim."
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

function money(p) {
  return currency === "USD" ? `$${p.usd.toLocaleString("en-US")}` : `Rp ${p.idr.toLocaleString("id-ID")}`;
}

function suffix(p) {
  const t = translations[language];
  if (p.priceSuffix === "month") return t.month;
  if (p.priceSuffix === "freehold") return t.freehold;
  return t.leasehold;
}

function isVisible(p) {
  return (activeType === "all" || p.type === activeType) &&
    (searchFilters.location === "all" || p.location === searchFilters.location) &&
    (searchFilters.type === "all" || p.type === searchFilters.type) &&
    (searchFilters.purpose === "all" || p.purpose === searchFilters.purpose);
}

function renderSkeletons(count = 6) {
  if (!propertyGrid) return;
  propertyGrid.innerHTML = Array.from({length:count}, () => `
    <article class="skeleton-card" aria-hidden="true">
      <div class="skeleton-media"></div>
      <div class="skeleton-body">
        <div class="skeleton-line sm"></div>
        <div class="skeleton-line lg"></div>
        <div class="skeleton-line md"></div>
      </div>
    </article>`).join("");
}

function hydrateCardImages() {
  propertyGrid?.querySelectorAll(".property-image[data-bg]").forEach(el => {
    const image = new Image();
    const done = () => el.classList.remove("image-loading");
    image.onload = () => {
      el.style.backgroundImage = `url('${el.dataset.bg}')`;
      done();
    };
    image.onerror = done;
    image.src = el.dataset.bg;
  });
}

function renderProperties() {
  if (!propertyGrid) return;
  const t = translations[language];
  const visible = properties.filter(isVisible);

  propertyGrid.innerHTML = visible.map(p => `
    <article class="property-card reveal-item">
      <a class="property-image image-loading" href="properties/${p.slug}.html" data-bg="${p.image}" aria-label="${p.title}">
        <div class="property-badges">
          ${p.featured ? `<span class="property-badge featured">${t.featured}</span>` : ""}
          <span class="property-badge">${p.purpose === "sale" ? t.forSale : t.forRent}</span>
        </div>
      </a>
      <div class="property-body">
        <span class="property-location">${p.location} · ${p.type}</span>
        <div class="property-title-row">
          <h3>${p.title}</h3>
          <div class="property-price">${money(p)}<small>${suffix(p)}</small></div>
        </div>
        <div class="property-specs">
          ${p.beds ? `<span>${p.beds} ${t.bedrooms}</span>` : ""}
          ${p.baths ? `<span>${p.baths} ${t.bathrooms}</span>` : ""}
          <span>${p.area}</span>
        </div>
        <button type="button" data-property-url="properties/${p.slug}.html">${t.viewDetails}</button>
      </div>
    </article>`).join("");

  emptyState.hidden = visible.length !== 0;
  propertyGrid.querySelectorAll("[data-property-url]").forEach(btn => btn.addEventListener("click", () => {
    window.location.href = btn.dataset.propertyUrl;
  }));
  hydrateCardImages();
  observeReveals(propertyGrid);
}

function applyLanguage({render = true} = {}) {
  const t = translations[language];
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.innerHTML = t[key];
  });
  if (languageToggle) languageToggle.textContent = language.toUpperCase();
  if (render && !initializing) renderProperties();
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function initRevealObserver() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal-item").forEach(el => el.classList.add("reveal-visible"));
    return;
  }

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("reveal-visible");
      revealObserver.unobserve(entry.target);
    });
  }, {threshold:.1, rootMargin:"0px 0px -35px 0px"});

  observeReveals(document);
}

function observeReveals(root) {
  const candidates = [];
  if (root?.matches?.(".reveal-item")) candidates.push(root);
  root?.querySelectorAll?.(".reveal-item").forEach(el => candidates.push(el));

  candidates.forEach(el => {
    if (el.dataset.revealBound) return;
    el.dataset.revealBound = "true";
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add("reveal-visible");
  });
}

function finishInitialLoad() {
  if (!initializing) return;
  initializing = false;
  clearTimeout(window.__propertySkeletonTimer);
  renderProperties();
}

languageToggle?.addEventListener("click", () => {
  language = language === "en" ? "id" : "en";
  localStorage.setItem("aup-language", language);
  applyLanguage({render:!initializing});
});

currencyToggle?.addEventListener("click", () => {
  currency = currency === "USD" ? "IDR" : "USD";
  localStorage.setItem("aup-currency", currency);
  currencyToggle.textContent = currency;
  if (initializing) finishInitialLoad();
  else renderProperties();
});

document.querySelectorAll(".filter-chip").forEach(chip => chip.addEventListener("click", () => {
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  activeType = chip.dataset.filter;
  if (initializing) finishInitialLoad();
  else renderProperties();
}));

document.getElementById("heroSearch")?.addEventListener("submit", event => {
  event.preventDefault();
  searchFilters = {
    location:document.getElementById("locationFilter").value,
    type:document.getElementById("typeFilter").value,
    purpose:document.getElementById("purposeFilter").value
  };
  activeType = "all";
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.toggle("active", c.dataset.filter === "all"));
  if (initializing) finishInitialLoad();
  else renderProperties();
  document.getElementById("properties")?.scrollIntoView({behavior:"smooth"});
});

const menuButton = document.getElementById("menuButton");
const mobileMenu = document.getElementById("mobileMenu");
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  mobileMenu?.classList.toggle("open", !open);
});
mobileMenu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  mobileMenu.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
}));

document.getElementById("contactForm")?.addEventListener("submit", event => {
  event.preventDefault();
  showToast(translations[language].inquiryToast);
  event.currentTarget.reset();
});

renderSkeletons();
applyLanguage({render:false});
if (currencyToggle) currencyToggle.textContent = currency;
initRevealObserver();
window.__propertySkeletonTimer = setTimeout(finishInitialLoad, 520);
