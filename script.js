const properties = [
  {
    id: 1,
    title: "Jungle Residence Ubud",
    location: "Ubud",
    type: "Villa",
    purpose: "sale",
    usd: 485000,
    idr: 7625000000,
    priceSuffix: "freehold",
    beds: 4,
    baths: 4,
    area: "420 m²",
    featured: true,
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=88",
    description: "A private tropical residence surrounded by greenery, designed for quiet living and long-term value in the Ubud area."
  },
  {
    id: 2,
    title: "Canggu Courtyard Villa",
    location: "Canggu",
    type: "Villa",
    purpose: "rent",
    usd: 3200,
    idr: 50300000,
    priceSuffix: "month",
    beds: 3,
    baths: 3,
    area: "280 m²",
    featured: true,
    image: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=88",
    description: "Contemporary indoor-outdoor living near Canggu's dining, beach and lifestyle hubs, available for long-term rental."
  },
  {
    id: 3,
    title: "Uluwatu Ocean Land",
    location: "Uluwatu",
    type: "Land",
    purpose: "sale",
    usd: 295000,
    idr: 4640000000,
    priceSuffix: "leasehold",
    beds: null,
    baths: null,
    area: "1,200 m²",
    featured: false,
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=88",
    description: "A spacious development opportunity in South Bali with strong hospitality and private residence potential."
  },
  {
    id: 4,
    title: "Sanur Garden House",
    location: "Sanur",
    type: "House",
    purpose: "sale",
    usd: 355000,
    idr: 5580000000,
    priceSuffix: "freehold",
    beds: 3,
    baths: 3,
    area: "310 m²",
    featured: false,
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=88",
    description: "A calm family home with garden space in a residential pocket of Sanur, balancing comfort with easy access to the coast."
  },
  {
    id: 5,
    title: "Seminyak Long-Stay Loft",
    location: "Seminyak",
    type: "Rental",
    purpose: "rent",
    usd: 1800,
    idr: 28300000,
    priceSuffix: "month",
    beds: 2,
    baths: 2,
    area: "150 m²",
    featured: false,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=88",
    description: "A polished long-stay rental close to Seminyak's restaurants and shopping, designed for professionals and extended stays."
  },
  {
    id: 6,
    title: "Ubud Creative Compound",
    location: "Ubud",
    type: "Commercial",
    purpose: "sale",
    usd: 610000,
    idr: 9590000000,
    priceSuffix: "leasehold",
    beds: null,
    baths: 4,
    area: "680 m²",
    featured: false,
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=88",
    description: "A flexible hospitality or creative-business compound with multiple functional zones and a premium Ubud setting."
  }
];

const translations = {
  en: {
    navProperties: "Properties", navLocations: "Locations", navServices: "Services", navAbout: "About", talkToUs: "Talk to us",
    heroEyebrow: "Bali property, curated with purpose", heroTitle: "Find your place<br>in Bali.", heroCopy: "From private villas and long-term rentals to land and commercial opportunities — discover properties selected for living, investing and building your next chapter.",
    searchLocationLabel: "Location", allBali: "All Bali", searchTypeLabel: "Property type", allTypes: "All types", searchPurposeLabel: "Purpose", saleAndRent: "Sale & Rent", forSale: "For sale", forRent: "For rent", searchButton: "Search properties",
    trustOne: "Local market knowledge", trustTwo: "International-ready service", trustThree: "Transparent inquiry process",
    selectedProperties: "Selected properties", curatedForYou: "Curated for the way you want to live.", propertyIntro: "Browse a growing collection of villas, homes, land and investment opportunities across Bali.", filterAll: "All",
    noResultsTitle: "No matching properties.", noResultsCopy: "Try another location or property type.",
    exploreByType: "Explore by type", propertyForEveryPlan: "A property for every plan.", catVilla: "Private stays, residences and investment villas.", catLand: "Strategic plots for building and long-term value.", catHome: "Comfortable homes for families and long-term living.", catCommercial: "Spaces built for business, hospitality and growth.",
    discoverBali: "Discover Bali", locationTitle: "Choose the neighbourhood that fits your story.", viewProperties: "View properties →", ubudText: "Culture · Nature · Wellness", cangguText: "Lifestyle · Surf · Dining", uluwatuText: "Cliffs · Ocean · Luxury",
    moreThanListings: "More than listings", serviceTitle: "A clear path from discovery to decision.", serviceCopy: "We help buyers, renters and investors navigate Bali property with a straightforward inquiry process and local support.", startInquiry: "Start an inquiry", serviceOneTitle: "Property discovery", serviceOneText: "Shortlist options around your location, budget and purpose.", serviceTwoTitle: "Private inquiry", serviceTwoText: "Ask questions, schedule viewings and verify property details.", serviceThreeTitle: "Payment coordination", serviceThreeText: "Manual payment coordination through PayPal when applicable.",
    aboutEyebrow: "Agung Ubud Property", aboutTitle: "Local perspective.<br>Global standard.", aboutCopy: "A premium property platform concept designed to connect local opportunities with buyers, renters and investors from around the world.",
    contactEyebrow: "Let’s find your Bali property", contactTitle: "Tell us what you’re looking for.", contactCopy: "This demo uses a manual inquiry flow. In production, inquiries can be connected to WhatsApp, email, CRM and PayPal payment instructions.", nameLabel: "Name", emailLabel: "Email", interestLabel: "I’m interested in", messageLabel: "Message", sendInquiry: "Send inquiry", demoNote: "Demo only — no personal data is transmitted.",
    footerTagline: "Premium Bali property for living, renting and investing.", footerExplore: "Explore", footerCompany: "Company", footerContact: "Contact", contactLink: "Contact", privacyLink: "Privacy", inquireProperty: "Inquire about this property",
    viewDetails: "View details →", featured: "Featured", property: "Property", bedrooms: "beds", bathrooms: "baths", month: "/ month", freehold: "Freehold", leasehold: "Leasehold",
    inquiryToast: "Demo inquiry received — no data was sent.", paypalToast: "PayPal payment is planned as a manual admin-confirmed flow in production."
  },
  id: {
    navProperties: "Properti", navLocations: "Lokasi", navServices: "Layanan", navAbout: "Tentang", talkToUs: "Hubungi kami",
    heroEyebrow: "Properti Bali, dikurasi dengan tujuan", heroTitle: "Temukan tempatmu<br>di Bali.", heroCopy: "Mulai dari vila privat dan sewa jangka panjang hingga tanah serta properti komersial — temukan pilihan untuk hunian, investasi, dan rencana berikutnya.",
    searchLocationLabel: "Lokasi", allBali: "Seluruh Bali", searchTypeLabel: "Jenis properti", allTypes: "Semua jenis", searchPurposeLabel: "Tujuan", saleAndRent: "Jual & Sewa", forSale: "Dijual", forRent: "Disewa", searchButton: "Cari properti",
    trustOne: "Wawasan pasar lokal", trustTwo: "Layanan siap internasional", trustThree: "Proses inquiry transparan",
    selectedProperties: "Properti pilihan", curatedForYou: "Dikurasi untuk cara hidup yang kamu inginkan.", propertyIntro: "Jelajahi koleksi vila, rumah, tanah, dan peluang investasi di berbagai area Bali.", filterAll: "Semua",
    noResultsTitle: "Properti tidak ditemukan.", noResultsCopy: "Coba lokasi atau jenis properti lain.",
    exploreByType: "Jelajahi berdasarkan jenis", propertyForEveryPlan: "Properti untuk setiap rencana.", catVilla: "Vila privat untuk hunian, liburan, dan investasi.", catLand: "Tanah strategis untuk pembangunan dan nilai jangka panjang.", catHome: "Hunian nyaman untuk keluarga dan tinggal jangka panjang.", catCommercial: "Ruang untuk bisnis, hospitality, dan pertumbuhan.",
    discoverBali: "Jelajahi Bali", locationTitle: "Pilih kawasan yang sesuai dengan ceritamu.", viewProperties: "Lihat properti →", ubudText: "Budaya · Alam · Wellness", cangguText: "Lifestyle · Surf · Kuliner", uluwatuText: "Tebing · Laut · Mewah",
    moreThanListings: "Lebih dari sekadar listing", serviceTitle: "Jalur yang jelas dari pencarian hingga keputusan.", serviceCopy: "Kami membantu pembeli, penyewa, dan investor menavigasi properti Bali melalui proses inquiry yang jelas dan dukungan lokal.", startInquiry: "Mulai inquiry", serviceOneTitle: "Pencarian properti", serviceOneText: "Temukan opsi berdasarkan lokasi, anggaran, dan kebutuhanmu.", serviceTwoTitle: "Inquiry privat", serviceTwoText: "Ajukan pertanyaan, jadwalkan viewing, dan verifikasi detail properti.", serviceThreeTitle: "Koordinasi pembayaran", serviceThreeText: "Koordinasi pembayaran manual melalui PayPal bila diperlukan.",
    aboutEyebrow: "Agung Ubud Property", aboutTitle: "Perspektif lokal.<br>Standar global.", aboutCopy: "Konsep platform properti premium untuk menghubungkan peluang lokal dengan pembeli, penyewa, dan investor dari berbagai negara.",
    contactEyebrow: "Temukan properti Bali kamu", contactTitle: "Ceritakan properti yang kamu cari.", contactCopy: "Demo ini menggunakan alur inquiry manual. Pada versi produksi, inquiry dapat dihubungkan ke WhatsApp, email, CRM, dan instruksi pembayaran PayPal.", nameLabel: "Nama", emailLabel: "Email", interestLabel: "Saya tertarik dengan", messageLabel: "Pesan", sendInquiry: "Kirim inquiry", demoNote: "Hanya demo — tidak ada data pribadi yang dikirim.",
    footerTagline: "Properti premium Bali untuk tinggal, menyewa, dan berinvestasi.", footerExplore: "Jelajahi", footerCompany: "Perusahaan", footerContact: "Kontak", contactLink: "Kontak", privacyLink: "Privasi", inquireProperty: "Tanyakan properti ini",
    viewDetails: "Lihat detail →", featured: "Pilihan", property: "Properti", bedrooms: "kamar", bathrooms: "km mandi", month: "/ bulan", freehold: "Hak milik", leasehold: "Leasehold",
    inquiryToast: "Inquiry demo diterima — tidak ada data yang dikirim.", paypalToast: "Pada versi produksi, pembayaran PayPal direncanakan melalui alur manual dengan konfirmasi admin."
  }
};

let language = "en";
let currency = "USD";
let activeType = "all";
let searchFilters = { location: "all", type: "all", purpose: "all" };

const propertyGrid = document.getElementById("propertyGrid");
const emptyState = document.getElementById("emptyState");
const languageToggle = document.getElementById("languageToggle");
const currencyToggle = document.getElementById("currencyToggle");
const propertyModal = document.getElementById("propertyModal");
const modalClose = document.getElementById("modalClose");
const toast = document.getElementById("toast");

function money(property) {
  if (currency === "USD") return `$${property.usd.toLocaleString("en-US")}`;
  return `Rp ${property.idr.toLocaleString("id-ID")}`;
}

function suffix(property) {
  const t = translations[language];
  if (property.priceSuffix === "month") return t.month;
  if (property.priceSuffix === "freehold") return t.freehold;
  return t.leasehold;
}

function isVisible(property) {
  const typeMatch = activeType === "all" || property.type === activeType;
  const locationMatch = searchFilters.location === "all" || property.location === searchFilters.location;
  const formTypeMatch = searchFilters.type === "all" || property.type === searchFilters.type;
  const purposeMatch = searchFilters.purpose === "all" || property.purpose === searchFilters.purpose;
  return typeMatch && locationMatch && formTypeMatch && purposeMatch;
}

function renderProperties() {
  const t = translations[language];
  const visible = properties.filter(isVisible);
  propertyGrid.innerHTML = visible.map((property) => `
    <article class="property-card">
      <div class="property-image" style="background-image:url('${property.image}')">
        <div class="property-badges">
          ${property.featured ? `<span class="property-badge featured">${t.featured}</span>` : ""}
          <span class="property-badge">${property.purpose === "sale" ? t.forSale : t.forRent}</span>
        </div>
      </div>
      <div class="property-body">
        <span class="property-location">${property.location} · ${property.type}</span>
        <div class="property-title-row">
          <h3>${property.title}</h3>
          <div class="property-price">${money(property)}<small>${suffix(property)}</small></div>
        </div>
        <div class="property-specs">
          ${property.beds ? `<span>${property.beds} ${t.bedrooms}</span>` : ""}
          ${property.baths ? `<span>${property.baths} ${t.bathrooms}</span>` : ""}
          <span>${property.area}</span>
        </div>
        <button type="button" data-property-id="${property.id}">${t.viewDetails}</button>
      </div>
    </article>
  `).join("");

  emptyState.hidden = visible.length !== 0;
  propertyGrid.querySelectorAll("[data-property-id]").forEach(button => {
    button.addEventListener("click", () => openProperty(Number(button.dataset.propertyId)));
  });
}

function applyLanguage() {
  const t = translations[language];
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.innerHTML = t[key];
  });
  languageToggle.textContent = language === "en" ? "EN" : "ID";
  renderProperties();
}

function openProperty(id) {
  const p = properties.find(item => item.id === id);
  const t = translations[language];
  if (!p) return;
  document.getElementById("modalImage").style.backgroundImage = `url('${p.image}')`;
  document.getElementById("modalMeta").textContent = `${p.location} · ${p.type} · ${p.purpose === "sale" ? t.forSale : t.forRent}`;
  document.getElementById("modalTitle").textContent = p.title;
  document.getElementById("modalDescription").textContent = p.description;
  document.getElementById("modalSpecs").innerHTML = [
    p.beds ? `${p.beds} ${t.bedrooms}` : null,
    p.baths ? `${p.baths} ${t.bathrooms}` : null,
    p.area,
    `${money(p)} ${suffix(p)}`
  ].filter(Boolean).map(item => `<span>${item}</span>`).join("");
  propertyModal.classList.add("open");
  propertyModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeProperty() {
  propertyModal.classList.remove("open");
  propertyModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

document.querySelectorAll(".filter-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(item => item.classList.remove("active"));
    chip.classList.add("active");
    activeType = chip.dataset.filter;
    renderProperties();
  });
});

document.getElementById("heroSearch").addEventListener("submit", event => {
  event.preventDefault();
  searchFilters = {
    location: document.getElementById("locationFilter").value,
    type: document.getElementById("typeFilter").value,
    purpose: document.getElementById("purposeFilter").value
  };
  activeType = "all";
  document.querySelectorAll(".filter-chip").forEach(chip => chip.classList.toggle("active", chip.dataset.filter === "all"));
  renderProperties();
  document.getElementById("properties").scrollIntoView({ behavior: "smooth" });
});

languageToggle.addEventListener("click", () => {
  language = language === "en" ? "id" : "en";
  applyLanguage();
});

currencyToggle.addEventListener("click", () => {
  currency = currency === "USD" ? "IDR" : "USD";
  currencyToggle.textContent = currency;
  renderProperties();
});

const menuButton = document.getElementById("menuButton");
const mobileMenu = document.getElementById("mobileMenu");
menuButton.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
mobileMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mobileMenu.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
}));

window.addEventListener("scroll", () => {
  document.querySelector(".site-header").classList.toggle("scrolled", window.scrollY > 40);
});

modalClose.addEventListener("click", closeProperty);
propertyModal.addEventListener("click", event => { if (event.target === propertyModal) closeProperty(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeProperty(); });
document.getElementById("modalInquiry").addEventListener("click", closeProperty);
document.getElementById("paypalButton").addEventListener("click", () => showToast(translations[language].paypalToast));

document.getElementById("contactForm").addEventListener("submit", event => {
  event.preventDefault();
  showToast(translations[language].inquiryToast);
  event.currentTarget.reset();
});

applyLanguage();
