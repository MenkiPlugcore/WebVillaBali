const WISHLIST_KEY="aup-saved-properties-v1";
(function ensureWishlistStyles(){if(document.querySelector('link[href="../wishlist.css"]'))return;const link=document.createElement("link");link.rel="stylesheet";link.href="../wishlist.css";document.head.appendChild(link);})();

const body=document.body;
const usd=Number(body.dataset.usd||0);
const idr=Number(body.dataset.idr||0);
const suffixType=body.dataset.suffix||"freehold";
let language=localStorage.getItem("aup-language")||"en";
let currency=localStorage.getItem("aup-currency")||"USD";
const slug=location.pathname.split("/").pop().replace(/\.html$/i,"");

const copy={
  en:{back:"Back to properties",inquire:"Inquire about this property",paypal:"PayPal payment info",overview:"Property overview",about:"About this property",highlights:"Highlights",location:"Location",name:"Name",email:"Email",message:"Message",send:"Send inquiry",note:"Demo only — no personal data is transmitted.",sent:"Demo inquiry received — no data was sent.",beds:"Bedrooms",baths:"Bathrooms",area:"Building / land area",status:"Status",sale:"For sale",rent:"For rent",freehold:"Freehold",leasehold:"Leasehold",month:"/ month",contactTitle:"Interested in this property?",contactText:"Share your details and the team can continue the conversation through the production inquiry flow.",navProperties:"Properties",navLocations:"Locations",navServices:"Services",navAbout:"About",talk:"Talk to us",home:"Home",properties:"Properties",privateInquiry:"Private inquiry",preview:"Concept preview · Built by CADERA",tenure:"Tenure",type:"Type",commercial:"Commercial",developmentLand:"Development land",saved:"Saved",save:"Save property",savedNow:"Property saved to your shortlist.",removedSaved:"Property removed from your shortlist."},
  id:{back:"Kembali ke properti",inquire:"Tanyakan properti ini",paypal:"Info pembayaran PayPal",overview:"Ringkasan properti",about:"Tentang properti ini",highlights:"Keunggulan",location:"Lokasi",name:"Nama",email:"Email",message:"Pesan",send:"Kirim inquiry",note:"Hanya demo — tidak ada data pribadi yang dikirim.",sent:"Inquiry demo diterima — tidak ada data yang dikirim.",beds:"Kamar tidur",baths:"Kamar mandi",area:"Luas bangunan / tanah",status:"Status",sale:"Dijual",rent:"Disewa",freehold:"Hak milik",leasehold:"Leasehold",month:"/ bulan",contactTitle:"Tertarik dengan properti ini?",contactText:"Kirim detail Anda dan tim dapat melanjutkan percakapan melalui alur inquiry versi produksi.",navProperties:"Properti",navLocations:"Lokasi",navServices:"Layanan",navAbout:"Tentang",talk:"Hubungi kami",home:"Beranda",properties:"Properti",privateInquiry:"Inquiry privat",preview:"Pratinjau konsep · Dibuat oleh CADERA",tenure:"Masa hak",type:"Jenis",commercial:"Komersial",developmentLand:"Tanah pengembangan",saved:"Tersimpan",save:"Simpan properti",savedNow:"Properti disimpan ke daftar pilihanmu.",removedSaved:"Properti dihapus dari daftar pilihanmu."}
};

const pageCopy={
  "jungle-residence-ubud":{
    en:{kicker:"UBUD · VILLA · FOR SALE",lead:"A private tropical residence surrounded by greenery, designed for quiet living and long-term value in the Ubud area.",specs:["4 beds","4 baths","420 m²"],aboutTitle:"Refined tropical living in Ubud.",aboutText:"This concept residence combines clean contemporary architecture with a calm garden setting. The layout is designed for private living, long-term stays, or a premium Bali investment profile.",highlights:["Private garden setting","Contemporary architecture","Four-bedroom layout","Premium Ubud positioning","Freehold concept","Suitable for residence or investment"],locationTitle:"Ubud, Bali",locationText:"Positioned for access to Ubud's culture, wellness, dining and nature while maintaining a quieter residential atmosphere.",placeholder:"I would like more information about Jungle Residence Ubud..."},
    id:{kicker:"UBUD · VILLA · DIJUAL",lead:"Hunian tropis privat yang dikelilingi suasana hijau, dirancang untuk kehidupan yang tenang dan nilai jangka panjang di kawasan Ubud.",specs:["4 kamar tidur","4 kamar mandi","420 m²"],aboutTitle:"Hunian tropis berkelas di Ubud.",aboutText:"Konsep hunian ini memadukan arsitektur kontemporer yang bersih dengan suasana taman yang tenang. Tata ruangnya cocok untuk hunian privat, tinggal jangka panjang, maupun profil investasi premium di Bali.",highlights:["Taman privat","Arsitektur kontemporer","Tata ruang empat kamar tidur","Posisi premium di Ubud","Konsep hak milik","Cocok untuk hunian atau investasi"],locationTitle:"Ubud, Bali",locationText:"Lokasinya memberi akses mudah ke budaya, wellness, kuliner, dan alam Ubud sambil tetap mempertahankan suasana residensial yang lebih tenang.",placeholder:"Saya ingin informasi lebih lanjut tentang Jungle Residence Ubud..."}
  },
  "canggu-courtyard-villa":{
    en:{kicker:"CANGGU · VILLA · FOR RENT",lead:"Contemporary indoor-outdoor living near Canggu's dining, beach and lifestyle hubs, available for long-term rental.",specs:["3 beds","3 baths","280 m²"],aboutTitle:"Modern Canggu living with privacy.",aboutText:"A polished three-bedroom villa concept built around easy indoor-outdoor movement, suited to extended stays for professionals, couples, or families seeking Canggu access without sacrificing privacy.",highlights:["Long-term rental concept","Private courtyard layout","Three bedrooms","Contemporary interiors","Near dining and lifestyle hubs","International tenant positioning"],locationTitle:"Canggu, Bali",locationText:"Close to Canggu's beaches, cafés, restaurants and coworking scene, while keeping a residential feel for longer stays.",placeholder:"I would like more information about Canggu Courtyard Villa..."},
    id:{kicker:"CANGGU · VILLA · DISEWA",lead:"Hunian indoor-outdoor kontemporer dekat pusat kuliner, pantai, dan gaya hidup Canggu, tersedia untuk sewa jangka panjang.",specs:["3 kamar tidur","3 kamar mandi","280 m²"],aboutTitle:"Gaya hidup Canggu modern dengan privasi.",aboutText:"Konsep vila tiga kamar ini dirancang untuk alur indoor-outdoor yang nyaman, cocok untuk profesional, pasangan, atau keluarga yang membutuhkan akses ke Canggu tanpa kehilangan privasi.",highlights:["Konsep sewa jangka panjang","Courtyard privat","Tiga kamar tidur","Interior kontemporer","Dekat pusat kuliner dan lifestyle","Cocok untuk penyewa internasional"],locationTitle:"Canggu, Bali",locationText:"Dekat dengan pantai, kafe, restoran, dan area coworking Canggu, namun tetap menawarkan suasana residensial untuk tinggal lebih lama.",placeholder:"Saya ingin informasi lebih lanjut tentang Canggu Courtyard Villa..."}
  },
  "uluwatu-ocean-land":{
    en:{kicker:"ULUWATU · LAND · FOR SALE",lead:"A spacious development opportunity in South Bali with strong hospitality and private residence potential.",specs:["1,200 m²","Development land"],aboutTitle:"A South Bali development opportunity.",aboutText:"This land concept is positioned for buyers exploring boutique hospitality, private villa development, or a long-term investment play in one of Bali's strongest lifestyle destinations.",highlights:["Large development footprint","South Bali positioning","Hospitality potential","Private residence potential","Leasehold concept","Investment-focused listing"],locationTitle:"Uluwatu, Bali",locationText:"South Bali continues to attract lifestyle, hospitality and premium residential demand, with strong appeal to international buyers and visitors.",placeholder:"I would like more information about Uluwatu Ocean Land..."},
    id:{kicker:"ULUWATU · TANAH · DIJUAL",lead:"Peluang pengembangan lahan yang luas di Bali Selatan dengan potensi kuat untuk hospitality maupun hunian privat.",specs:["1.200 m²","Tanah pengembangan"],aboutTitle:"Peluang pengembangan di Bali Selatan.",aboutText:"Konsep lahan ini ditujukan bagi pembeli yang mempertimbangkan hospitality butik, pembangunan vila privat, atau investasi jangka panjang di salah satu destinasi lifestyle terkuat di Bali.",highlights:["Lahan pengembangan luas","Posisi strategis di Bali Selatan","Potensi hospitality","Potensi hunian privat","Konsep leasehold","Berorientasi investasi"],locationTitle:"Uluwatu, Bali",locationText:"Bali Selatan terus menarik permintaan lifestyle, hospitality, dan hunian premium, dengan daya tarik kuat bagi pembeli serta pengunjung internasional.",placeholder:"Saya ingin informasi lebih lanjut tentang Uluwatu Ocean Land..."}
  },
  "sanur-garden-house":{
    en:{kicker:"SANUR · HOUSE · FOR SALE",lead:"A calm family home with garden space in a residential pocket of Sanur, balancing comfort with easy access to the coast.",specs:["3 beds","3 baths","310 m²"],aboutTitle:"A quieter side of coastal Bali.",aboutText:"Designed as a comfortable long-term residence, this concept pairs a practical three-bedroom plan with garden space and a residential Sanur setting suited to families and owner-occupiers.",highlights:["Family-oriented layout","Private garden","Residential Sanur setting","Three bedrooms","Freehold concept","Coastal access"],locationTitle:"Sanur, Bali",locationText:"Sanur offers a more relaxed coastal rhythm with established services, restaurants, schools and convenient access to central and eastern Bali.",placeholder:"I would like more information about Sanur Garden House..."},
    id:{kicker:"SANUR · RUMAH · DIJUAL",lead:"Rumah keluarga yang tenang dengan area taman di lingkungan residensial Sanur, memadukan kenyamanan dengan akses mudah ke pesisir.",specs:["3 kamar tidur","3 kamar mandi","310 m²"],aboutTitle:"Sisi Bali pesisir yang lebih tenang.",aboutText:"Dirancang sebagai hunian jangka panjang yang nyaman, konsep ini memadukan tata ruang tiga kamar yang praktis, taman privat, dan lingkungan Sanur yang cocok untuk keluarga maupun pemilik yang tinggal langsung.",highlights:["Tata ruang ramah keluarga","Taman privat","Lingkungan residensial Sanur","Tiga kamar tidur","Konsep hak milik","Akses ke pesisir"],locationTitle:"Sanur, Bali",locationText:"Sanur menawarkan ritme pesisir yang lebih santai dengan layanan, restoran, sekolah, serta akses yang nyaman ke Bali bagian tengah dan timur.",placeholder:"Saya ingin informasi lebih lanjut tentang Sanur Garden House..."}
  },
  "seminyak-long-stay-loft":{
    en:{kicker:"SEMINYAK · RENTAL · FOR RENT",lead:"A polished long-stay rental close to Seminyak's restaurants and shopping, designed for professionals and extended stays.",specs:["2 beds","2 baths","150 m²"],aboutTitle:"A practical base for extended Bali stays.",aboutText:"This two-bedroom loft concept is aimed at tenants who want a polished, centrally located home base with easy access to Seminyak's dining, retail and beach lifestyle.",highlights:["Long-stay positioning","Two-bedroom layout","Modern interior concept","Central Seminyak access","Monthly rental model","Professional tenant appeal"],locationTitle:"Seminyak, Bali",locationText:"A mature Bali lifestyle district with strong access to restaurants, retail, hospitality and the west-coast beach corridor.",placeholder:"I would like more information about Seminyak Long-Stay Loft..."},
    id:{kicker:"SEMINYAK · SEWA · DISEWA",lead:"Hunian sewa jangka panjang yang rapi dekat restoran dan pusat belanja Seminyak, dirancang untuk profesional dan masa tinggal yang lebih lama.",specs:["2 kamar tidur","2 kamar mandi","150 m²"],aboutTitle:"Basis praktis untuk tinggal lebih lama di Bali.",aboutText:"Konsep loft dua kamar ini ditujukan bagi penyewa yang menginginkan hunian modern di lokasi sentral dengan akses mudah ke kuliner, retail, dan gaya hidup pantai Seminyak.",highlights:["Cocok untuk long stay","Tata ruang dua kamar tidur","Konsep interior modern","Akses pusat Seminyak","Model sewa bulanan","Menarik untuk penyewa profesional"],locationTitle:"Seminyak, Bali",locationText:"Kawasan lifestyle Bali yang matang dengan akses kuat ke restoran, retail, hospitality, dan koridor pantai barat.",placeholder:"Saya ingin informasi lebih lanjut tentang Seminyak Long-Stay Loft..."}
  },
  "ubud-creative-compound":{
    en:{kicker:"UBUD · COMMERCIAL · FOR SALE",lead:"A flexible hospitality or creative-business compound with multiple functional zones and a premium Ubud setting.",specs:["4 baths","680 m²","Commercial"],aboutTitle:"A flexible base for hospitality or creative business.",aboutText:"This compound concept provides multiple usable zones for boutique hospitality, studio, wellness, coworking, or other creative commercial use in the Ubud market.",highlights:["Flexible commercial zoning concept","Multiple functional areas","Hospitality potential","Creative-business positioning","Premium Ubud market","Leasehold concept"],locationTitle:"Ubud, Bali",locationText:"Ubud's international wellness, culture and hospitality ecosystem makes it a strong destination for creative commercial concepts and boutique businesses.",placeholder:"I would like more information about Ubud Creative Compound..."},
    id:{kicker:"UBUD · KOMERSIAL · DIJUAL",lead:"Kompleks fleksibel untuk hospitality atau bisnis kreatif dengan beberapa zona fungsional di kawasan premium Ubud.",specs:["4 kamar mandi","680 m²","Komersial"],aboutTitle:"Basis fleksibel untuk hospitality atau bisnis kreatif.",aboutText:"Konsep kompleks ini menyediakan beberapa area yang dapat digunakan untuk hospitality butik, studio, wellness, coworking, maupun kebutuhan komersial kreatif lain di pasar Ubud.",highlights:["Konsep zonasi komersial fleksibel","Beberapa area fungsional","Potensi hospitality","Posisi untuk bisnis kreatif","Pasar premium Ubud","Konsep leasehold"],locationTitle:"Ubud, Bali",locationText:"Ekosistem wellness, budaya, dan hospitality internasional di Ubud menjadikannya lokasi kuat untuk konsep komersial kreatif dan bisnis butik.",placeholder:"Saya ingin informasi lebih lanjut tentang Ubud Creative Compound..."}
  }
};

const detailPropertyMeta={
  "jungle-residence-ubud":{slug:"jungle-residence-ubud",title:"Jungle Residence Ubud",location:"Ubud",type:"Villa",purpose:"sale",usd:485000,idr:7625000000,priceSuffix:"freehold",beds:4,baths:4,area:"420 m²",image:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=88"},
  "canggu-courtyard-villa":{slug:"canggu-courtyard-villa",title:"Canggu Courtyard Villa",location:"Canggu",type:"Villa",purpose:"rent",usd:3200,idr:50300000,priceSuffix:"month",beds:3,baths:3,area:"280 m²",image:"https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=88"},
  "uluwatu-ocean-land":{slug:"uluwatu-ocean-land",title:"Uluwatu Ocean Land",location:"Uluwatu",type:"Land",purpose:"sale",usd:295000,idr:4640000000,priceSuffix:"leasehold",beds:null,baths:null,area:"1,200 m²",image:"https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=88"},
  "sanur-garden-house":{slug:"sanur-garden-house",title:"Sanur Garden House",location:"Sanur",type:"House",purpose:"sale",usd:355000,idr:5580000000,priceSuffix:"freehold",beds:3,baths:3,area:"310 m²",image:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=88"},
  "seminyak-long-stay-loft":{slug:"seminyak-long-stay-loft",title:"Seminyak Long-Stay Loft",location:"Seminyak",type:"Rental",purpose:"rent",usd:1800,idr:28300000,priceSuffix:"month",beds:2,baths:2,area:"150 m²",image:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=88"},
  "ubud-creative-compound":{slug:"ubud-creative-compound",title:"Ubud Creative Compound",location:"Ubud",type:"Commercial",purpose:"sale",usd:610000,idr:9590000000,priceSuffix:"leasehold",beds:null,baths:4,area:"680 m²",image:"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=88"}
};

function readSaved(){try{const parsed=JSON.parse(localStorage.getItem(WISHLIST_KEY)||"[]");return Array.isArray(parsed)?parsed:[]}catch{return[]}}
function writeSaved(items){localStorage.setItem(WISHLIST_KEY,JSON.stringify(items))}
function isSaved(){return readSaved().some(item=>item.slug===slug)}
function injectSavedNav(){
  const actions=document.querySelector(".header-actions");
  if(actions&&!actions.querySelector(".saved-nav-link")){
    const a=document.createElement("a");a.className="saved-nav-link";a.href="../saved.html";a.innerHTML='<span class="saved-nav-heart">♡</span><span class="saved-nav-label"></span><span class="saved-count">0</span>';
    actions.insertBefore(a,actions.querySelector("#languageToggle")||actions.firstChild);
  }
  updateSavedUi();
}
function ensureDetailSaveButton(){
  const actions=document.querySelector(".detail-actions");
  if(!actions||actions.querySelector(".detail-save-btn"))return;
  const btn=document.createElement("button");btn.type="button";btn.className="detail-save-btn";btn.id="detailSave";btn.innerHTML='<span class="save-heart">♡</span><span class="save-label"></span>';
  actions.appendChild(btn);
  btn.addEventListener("click",toggleSaved);
}
function updateSavedUi(){
  const t=copy[language];const saved=isSaved();const count=readSaved().length;
  document.querySelectorAll(".saved-count").forEach(el=>el.textContent=count);
  document.querySelectorAll(".saved-nav-label").forEach(el=>el.textContent=t.saved);
  const btn=document.getElementById("detailSave");
  if(btn){btn.classList.toggle("is-saved",saved);btn.setAttribute("aria-pressed",String(saved));const heart=btn.querySelector(".save-heart");const label=btn.querySelector(".save-label");if(heart)heart.textContent=saved?"♥":"♡";if(label)label.textContent=saved?t.saved:t.save;}
}
function toggleSaved(){
  const property=detailPropertyMeta[slug];if(!property)return;
  const items=readSaved();const index=items.findIndex(item=>item.slug===slug);let nowSaved=false;
  if(index>=0)items.splice(index,1);else{items.push({...property});nowSaved=true;}
  writeSaved(items);updateSavedUi();showToast(copy[language][nowSaved?"savedNow":"removedSaved"]);
}

function formatPrice(){const el=document.getElementById("detailPrice");const suffix=document.getElementById("detailPriceSuffix");if(el)el.textContent=currency==="USD"?`$${usd.toLocaleString("en-US")}`:`Rp ${idr.toLocaleString("id-ID")}`;if(suffix){const t=copy[language];suffix.textContent=suffixType==="month"?t.month:suffixType==="leasehold"?t.leasehold:t.freehold;}}
function setText(selector,text){const el=document.querySelector(selector);if(el&&text!=null)el.textContent=text}
function setTextIn(root,selector,text){const el=root.querySelector(selector);if(el&&text!=null)el.textContent=text}
function applyPageSpecificLanguage(){
  const data=pageCopy[slug]?.[language];if(!data)return;
  setText(".detail-summary>.detail-kicker",data.kicker);setText(".detail-lead",data.lead);
  document.querySelectorAll(".detail-specs span").forEach((el,i)=>{if(data.specs[i])el.textContent=data.specs[i]});
  const sections=document.querySelectorAll(".detail-content>section");
  if(sections[0]){setTextIn(sections[0],"h2",data.aboutTitle);const p=sections[0].querySelector("p:not(.detail-kicker)");if(p)p.textContent=data.aboutText;}
  document.querySelectorAll(".feature-list li").forEach((el,i)=>{if(data.highlights[i])el.textContent=data.highlights[i]});
  if(sections[3]){setTextIn(sections[3],"h2",data.locationTitle);const p=sections[3].querySelector("p:not(.detail-kicker)");if(p)p.textContent=data.locationText;}
  const textarea=document.querySelector("#inquiryForm textarea");if(textarea)textarea.placeholder=data.placeholder;
}
function applyLanguage(){
  const t=copy[language];document.documentElement.lang=language;
  document.querySelectorAll("[data-copy]").forEach(el=>{if(t[el.dataset.copy])el.textContent=t[el.dataset.copy]});
  const nav=document.querySelectorAll(".desktop-nav a");[t.navProperties,t.navLocations,t.navServices,t.navAbout].forEach((text,i)=>{if(nav[i])nav[i].textContent=text});
  setText(".header-cta",t.talk);
  const crumbs=document.querySelectorAll(".property-breadcrumb a");if(crumbs[0])crumbs[0].textContent=t.home;if(crumbs[1])crumbs[1].textContent=t.properties;
  setText(".inquiry-card>.detail-kicker",t.privateInquiry);
  const footerSpans=document.querySelectorAll("footer .footer-bottom span");if(footerSpans[1])footerSpans[1].textContent=t.preview;
  document.querySelectorAll(".overview-item small").forEach(el=>{const raw=(el.dataset.originalText||el.textContent).trim();if(!el.dataset.originalText)el.dataset.originalText=raw;if(raw==="Tenure")el.textContent=t.tenure;else if(raw==="Type")el.textContent=t.type});
  document.querySelectorAll(".overview-item strong").forEach(el=>{const raw=(el.dataset.originalText||el.textContent).trim();if(!el.dataset.originalText)el.dataset.originalText=raw;if(raw==="Commercial")el.textContent=t.commercial;else if(raw==="Development land")el.textContent=t.developmentLand});
  applyPageSpecificLanguage();const languageToggle=document.getElementById("languageToggle");if(languageToggle)languageToggle.textContent=language.toUpperCase();formatPrice();updateSavedUi();
}
function showToast(msg){const toast=document.getElementById("propertyToast");if(!toast)return;toast.textContent=msg;toast.classList.add("show");clearTimeout(window.__propertyToast);window.__propertyToast=setTimeout(()=>toast.classList.remove("show"),2600)}

injectSavedNav();ensureDetailSaveButton();
document.getElementById("languageToggle")?.addEventListener("click",()=>{language=language==="en"?"id":"en";localStorage.setItem("aup-language",language);applyLanguage()});
document.getElementById("currencyToggle")?.addEventListener("click",()=>{currency=currency==="USD"?"IDR":"USD";localStorage.setItem("aup-currency",currency);document.getElementById("currencyToggle").textContent=currency;formatPrice()});
document.getElementById("paypalInfo")?.addEventListener("click",()=>showToast(language==="en"?"PayPal will use a manual admin-confirmed flow in production.":"PayPal akan menggunakan alur manual dengan konfirmasi admin pada versi produksi."));
document.getElementById("detailInquiry")?.addEventListener("click",()=>document.getElementById("inquiryForm")?.scrollIntoView({behavior:"smooth",block:"center"}));
document.getElementById("inquiryForm")?.addEventListener("submit",event=>{event.preventDefault();showToast(copy[language].sent);event.currentTarget.reset()});
const currencyToggle=document.getElementById("currencyToggle");if(currencyToggle)currencyToggle.textContent=currency;applyLanguage();window.addEventListener("storage",updateSavedUi);
