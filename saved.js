const STORAGE_KEY = "aup-saved-properties-v1";
let language = localStorage.getItem("aup-language") || "en";
let currency = localStorage.getItem("aup-currency") || "USD";

const copy = {
  en: {
    properties:"Properties", locations:"Locations", services:"Services", about:"About", talk:"Talk to us", saved:"Saved",
    eyebrow:"Your shortlist", title:"Properties worth another look.", intro:"Keep the properties you like in one place while you compare areas, prices, and possibilities.",
    deviceNote:"Saved on this browser only — no account required.", emptyTitle:"Nothing saved yet.", emptyText:"Tap the heart on any property and it will appear here instantly.", browse:"Browse properties", preview:"Concept preview · Built by CADERA",
    forSale:"For sale", forRent:"For rent", beds:"beds", baths:"baths", month:"/ month", freehold:"Freehold", leasehold:"Leasehold", view:"View property →", removed:"Removed from saved properties."
  },
  id: {
    properties:"Properti", locations:"Lokasi", services:"Layanan", about:"Tentang", talk:"Hubungi kami", saved:"Tersimpan",
    eyebrow:"Daftar pilihanmu", title:"Properti yang layak dilihat lagi.", intro:"Simpan properti yang menarik agar lebih mudah membandingkan lokasi, harga, dan pilihannya.",
    deviceNote:"Tersimpan hanya di browser ini — tanpa perlu akun.", emptyTitle:"Belum ada properti tersimpan.", emptyText:"Tekan ikon hati pada properti mana pun dan properti itu akan langsung muncul di sini.", browse:"Lihat properti", preview:"Pratinjau konsep · Dibuat oleh CADERA",
    forSale:"Dijual", forRent:"Disewa", beds:"kamar", baths:"km mandi", month:"/ bulan", freehold:"Hak milik", leasehold:"Leasehold", view:"Lihat properti →", removed:"Properti dihapus dari daftar tersimpan."
  }
};

function readSaved(){
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function writeSaved(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function suffix(p){
  const t = copy[language];
  if (p.priceSuffix === "month") return t.month;
  if (p.priceSuffix === "freehold") return t.freehold;
  return t.leasehold;
}
function money(p){
  return currency === "USD" ? `$${Number(p.usd||0).toLocaleString("en-US")}` : `Rp ${Number(p.idr||0).toLocaleString("id-ID")}`;
}
function showToast(message){
  const toast = document.getElementById("savedToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__savedToast);
  window.__savedToast = setTimeout(()=>toast.classList.remove("show"),2400);
}
function applyLanguage(){
  const t = copy[language];
  document.documentElement.lang = language;
  document.querySelectorAll("[data-copy]").forEach(el=>{ const key=el.dataset.copy; if(t[key]) el.textContent=t[key]; });
  const toggle = document.getElementById("languageToggle");
  if(toggle) toggle.textContent = language.toUpperCase();
}
function updateCount(){
  const count = readSaved().length;
  const el = document.getElementById("savedCount");
  if(el) el.textContent = count;
}
function renderSaved(){
  const items = readSaved();
  const grid = document.getElementById("savedGrid");
  const empty = document.getElementById("savedEmpty");
  const t = copy[language];
  updateCount();
  if(!grid || !empty) return;
  empty.hidden = items.length !== 0;
  grid.hidden = items.length === 0;
  grid.innerHTML = items.map(p=>`
    <article class="saved-card">
      <a class="saved-card-media" href="properties/${p.slug}.html" style="background-image:url('${p.image}')" aria-label="${p.title}">
        <button class="saved-card-remove" type="button" data-remove-slug="${p.slug}" aria-label="Remove ${p.title} from saved properties">♥</button>
      </a>
      <div class="saved-card-body">
        <span class="saved-card-meta">${p.location} · ${p.type} · ${p.purpose === "sale" ? t.forSale : t.forRent}</span>
        <div class="saved-card-head">
          <h2>${p.title}</h2>
          <div class="saved-card-price">${money(p)}<small>${suffix(p)}</small></div>
        </div>
        <div class="saved-card-specs">
          ${p.beds ? `<span>${p.beds} ${t.beds}</span>` : ""}
          ${p.baths ? `<span>${p.baths} ${t.baths}</span>` : ""}
          ${p.area ? `<span>${p.area}</span>` : ""}
        </div>
        <a class="saved-card-view" href="properties/${p.slug}.html">${t.view}</a>
      </div>
    </article>`).join("");

  grid.querySelectorAll("[data-remove-slug]").forEach(btn=>{
    btn.addEventListener("click", event=>{
      event.preventDefault();
      event.stopPropagation();
      const next = readSaved().filter(item=>item.slug !== btn.dataset.removeSlug);
      writeSaved(next);
      renderSaved();
      showToast(copy[language].removed);
    });
  });
}

document.getElementById("languageToggle")?.addEventListener("click",()=>{
  language = language === "en" ? "id" : "en";
  localStorage.setItem("aup-language",language);
  applyLanguage();
  renderSaved();
});
document.getElementById("currencyToggle")?.addEventListener("click",()=>{
  currency = currency === "USD" ? "IDR" : "USD";
  localStorage.setItem("aup-currency",currency);
  document.getElementById("currencyToggle").textContent = currency;
  renderSaved();
});

applyLanguage();
document.getElementById("currencyToggle").textContent = currency;
renderSaved();
window.addEventListener("storage",renderSaved);
