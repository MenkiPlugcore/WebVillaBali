const body=document.body;
const usd=Number(body.dataset.usd||0);
const idr=Number(body.dataset.idr||0);
const suffixType=body.dataset.suffix||"freehold";
let language=localStorage.getItem("aup-language")||"en";
let currency=localStorage.getItem("aup-currency")||"USD";

const copy={
  en:{back:"Back to properties",inquire:"Inquire about this property",paypal:"PayPal payment info",overview:"Property overview",about:"About this property",highlights:"Highlights",location:"Location",name:"Name",email:"Email",message:"Message",send:"Send inquiry",note:"Demo only — no personal data is transmitted.",sent:"Demo inquiry received — no data was sent.",beds:"Bedrooms",baths:"Bathrooms",area:"Building / land area",status:"Status",sale:"For sale",rent:"For rent",freehold:"Freehold",leasehold:"Leasehold",month:"/ month",contactTitle:"Interested in this property?",contactText:"Share your details and the team can continue the conversation through the production inquiry flow."},
  id:{back:"Kembali ke properti",inquire:"Tanyakan properti ini",paypal:"Info pembayaran PayPal",overview:"Ringkasan properti",about:"Tentang properti ini",highlights:"Keunggulan",location:"Lokasi",name:"Nama",email:"Email",message:"Pesan",send:"Kirim inquiry",note:"Hanya demo — tidak ada data pribadi yang dikirim.",sent:"Inquiry demo diterima — tidak ada data yang dikirim.",beds:"Kamar tidur",baths:"Kamar mandi",area:"Luas bangunan / tanah",status:"Status",sale:"Dijual",rent:"Disewa",freehold:"Hak milik",leasehold:"Leasehold",month:"/ bulan",contactTitle:"Tertarik dengan properti ini?",contactText:"Kirim detail Anda dan tim dapat melanjutkan percakapan melalui alur inquiry versi produksi."}
};

function formatPrice(){
  const el=document.getElementById("detailPrice");
  const suffix=document.getElementById("detailPriceSuffix");
  if(el)el.textContent=currency==="USD"?`$${usd.toLocaleString("en-US")}`:`Rp ${idr.toLocaleString("id-ID")}`;
  if(suffix){const t=copy[language];suffix.textContent=suffixType==="month"?t.month:suffixType==="leasehold"?t.leasehold:t.freehold;}
}
function applyLanguage(){
  const t=copy[language];document.documentElement.lang=language;
  document.querySelectorAll("[data-copy]").forEach(el=>{if(t[el.dataset.copy])el.textContent=t[el.dataset.copy]});
  document.getElementById("languageToggle").textContent=language.toUpperCase();formatPrice();
}
function showToast(msg){const toast=document.getElementById("propertyToast");if(!toast)return;toast.textContent=msg;toast.classList.add("show");clearTimeout(window.__propertyToast);window.__propertyToast=setTimeout(()=>toast.classList.remove("show"),2600)}

document.getElementById("languageToggle")?.addEventListener("click",()=>{language=language==="en"?"id":"en";localStorage.setItem("aup-language",language);applyLanguage()});
document.getElementById("currencyToggle")?.addEventListener("click",()=>{currency=currency==="USD"?"IDR":"USD";localStorage.setItem("aup-currency",currency);document.getElementById("currencyToggle").textContent=currency;formatPrice()});
document.getElementById("paypalInfo")?.addEventListener("click",()=>showToast(language==="en"?"PayPal will use a manual admin-confirmed flow in production.":"PayPal akan menggunakan alur manual dengan konfirmasi admin pada versi produksi."));
document.getElementById("detailInquiry")?.addEventListener("click",()=>document.getElementById("inquiryForm")?.scrollIntoView({behavior:"smooth",block:"center"}));
document.getElementById("inquiryForm")?.addEventListener("submit",event=>{event.preventDefault();showToast(copy[language].sent);event.currentTarget.reset()});

document.getElementById("currencyToggle").textContent=currency;applyLanguage();
