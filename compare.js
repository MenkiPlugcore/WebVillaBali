(() => {
  const KEY = "aup-compare-properties-v1";
  const MAX = 3;
  const inProperties = location.pathname.includes("/properties/");
  const base = inProperties ? "../" : "";
  const language = () => localStorage.getItem("aup-language") || "en";
  const currency = () => localStorage.getItem("aup-currency") || "USD";

  const catalog = [
    {ref:"AUP-001",slug:"jungle-residence-ubud",title:"Jungle Residence Ubud",location:"Ubud",type:"Villa",purpose:"sale",usd:485000,idr:7625000000,priceSuffix:"freehold",beds:4,baths:4,area:"420 m²",tenure:"freehold",image:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=88"},
    {ref:"AUP-002",slug:"canggu-courtyard-villa",title:"Canggu Courtyard Villa",location:"Canggu",type:"Villa",purpose:"rent",usd:3200,idr:50300000,priceSuffix:"month",beds:3,baths:3,area:"280 m²",tenure:"rental",image:"https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=88"},
    {ref:"AUP-003",slug:"uluwatu-ocean-land",title:"Uluwatu Ocean Land",location:"Uluwatu",type:"Land",purpose:"sale",usd:295000,idr:4640000000,priceSuffix:"leasehold",beds:null,baths:null,area:"1,200 m²",tenure:"leasehold",image:"https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=88"},
    {ref:"AUP-004",slug:"sanur-garden-house",title:"Sanur Garden House",location:"Sanur",type:"House",purpose:"sale",usd:355000,idr:5580000000,priceSuffix:"freehold",beds:3,baths:3,area:"310 m²",tenure:"freehold",image:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=88"},
    {ref:"AUP-005",slug:"seminyak-long-stay-loft",title:"Seminyak Long-Stay Loft",location:"Seminyak",type:"Rental",purpose:"rent",usd:1800,idr:28300000,priceSuffix:"month",beds:2,baths:2,area:"150 m²",tenure:"rental",image:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=88"},
    {ref:"AUP-006",slug:"ubud-creative-compound",title:"Ubud Creative Compound",location:"Ubud",type:"Commercial",purpose:"sale",usd:610000,idr:9590000000,priceSuffix:"leasehold",beds:null,baths:4,area:"680 m²",tenure:"leasehold",image:"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=88"}
  ];

  const copy = {
    en:{compare:"Compare",add:"Compare",added:"Added",remove:"Remove",compareNow:"Compare now",limit:"You can compare up to 3 properties.",addedToast:"Added to comparison.",removedToast:"Removed from comparison.",properties:"Properties",locations:"Locations",services:"Services",about:"About",talk:"Talk to us",saved:"Saved",eyebrow:"Property comparison",title:"Compare the details that matter.",intro:"Put up to three properties side by side to compare price, location, size, tenure, and key specifications.",device:"Comparison is saved on this browser — no account required.",statusOne:"1 property selected — add another for a clearer comparison.",statusMany:n=>`${n} properties selected`,clear:"Clear comparison",emptyTitle:"Choose properties to compare.",emptyText:"Add up to three listings from the property cards, saved properties, or a property detail page.",browse:"Browse properties",preview:"Concept preview · Built by CADERA",price:"Price",location:"Location",type:"Property type",purpose:"Purpose",beds:"Bedrooms",baths:"Bathrooms",area:"Area",tenure:"Tenure",reference:"Reference",forSale:"For sale",forRent:"For rent",freehold:"Freehold",leasehold:"Leasehold",rental:"Long-term rental",month:"/ month",view:"View property",none:"—"},
    id:{compare:"Bandingkan",add:"Bandingkan",added:"Dipilih",remove:"Hapus",compareNow:"Bandingkan sekarang",limit:"Maksimal 3 properti dapat dibandingkan sekaligus.",addedToast:"Properti ditambahkan ke perbandingan.",removedToast:"Properti dihapus dari perbandingan.",properties:"Properti",locations:"Lokasi",services:"Layanan",about:"Tentang",talk:"Hubungi kami",saved:"Tersimpan",eyebrow:"Perbandingan properti",title:"Bandingkan detail yang paling penting.",intro:"Bandingkan hingga tiga properti secara berdampingan berdasarkan harga, lokasi, luas, status hak, dan spesifikasi utama.",device:"Perbandingan tersimpan di browser ini — tanpa perlu akun.",statusOne:"1 properti dipilih — tambahkan satu lagi agar lebih mudah dibandingkan.",statusMany:n=>`${n} properti dipilih`,clear:"Hapus semua",emptyTitle:"Pilih properti untuk dibandingkan.",emptyText:"Tambahkan maksimal tiga listing dari kartu properti, halaman tersimpan, atau halaman detail properti.",browse:"Lihat properti",preview:"Pratinjau konsep · Dibuat oleh CADERA",price:"Harga",location:"Lokasi",type:"Jenis properti",purpose:"Tujuan",beds:"Kamar tidur",baths:"Kamar mandi",area:"Luas",tenure:"Status hak",reference:"Referensi",forSale:"Dijual",forRent:"Disewa",freehold:"Hak milik",leasehold:"Leasehold",rental:"Sewa jangka panjang",month:"/ bulan",view:"Lihat properti",none:"—"}
  };

  function t(){ return copy[language()] || copy.en; }
  function read(){
    try { const parsed=JSON.parse(localStorage.getItem(KEY)||"[]"); return Array.isArray(parsed)?parsed.filter(slug=>catalog.some(p=>p.slug===slug)).slice(0,MAX):[]; }
    catch { return []; }
  }
  function write(items){ localStorage.setItem(KEY,JSON.stringify([...new Set(items)].slice(0,MAX))); }
  function selected(slug){ return read().includes(slug); }
  function property(slug){ return catalog.find(p=>p.slug===slug); }
  function hrefFor(slug){ return `${base}properties/${slug}.html`; }
  function compareHref(){ return `${base}compare.html`; }
  function savedHref(){ return `${base}saved.html`; }
  function money(p){ return currency()==="USD"?`$${p.usd.toLocaleString("en-US")}`:`Rp ${p.idr.toLocaleString("id-ID")}`; }
  function suffix(p){ const c=t(); return p.priceSuffix==="month"?c.month:p.priceSuffix==="freehold"?c.freehold:c.leasehold; }
  function tenure(p){ const c=t(); return p.tenure==="freehold"?c.freehold:p.tenure==="leasehold"?c.leasehold:c.rental; }
  function purpose(p){ return p.purpose==="sale"?t().forSale:t().forRent; }

  function ensureStyle(){
    if(document.querySelector('link[data-compare-style]')) return;
    const link=document.createElement("link"); link.rel="stylesheet"; link.href=`${base}compare.css`; link.dataset.compareStyle="true"; document.head.appendChild(link);
  }
  function toast(message){
    let el=document.querySelector(".compare-toast");
    if(!el){ el=document.createElement("div"); el.className="compare-toast"; el.setAttribute("role","status"); el.setAttribute("aria-live","polite"); document.body.appendChild(el); }
    el.textContent=message; el.classList.add("show"); clearTimeout(window.__compareToast); window.__compareToast=setTimeout(()=>el.classList.remove("show"),2300);
  }
  function toggle(slug){
    const items=read(); const index=items.indexOf(slug);
    if(index>=0){ items.splice(index,1); write(items); toast(t().removedToast); }
    else { if(items.length>=MAX){ toast(t().limit); return; } items.push(slug); write(items); toast(t().addedToast); }
    refresh();
  }
  function remove(slug){ write(read().filter(x=>x!==slug)); refresh(); }

  function injectNav(){
    const actions=document.querySelector(".header-actions");
    if(actions && !actions.querySelector(".compare-nav-link")){
      const a=document.createElement("a"); a.className="compare-nav-link"; a.href=compareHref();
      a.innerHTML='<span class="compare-nav-icon">⇄</span><span class="compare-nav-label"></span><span class="compare-count">0</span>';
      const anchor=actions.querySelector("#languageToggle"); actions.insertBefore(a,anchor||actions.firstChild);
      if(document.body.classList.contains("compare-page")) a.setAttribute("aria-current","page");
    }
    const mobile=document.getElementById("mobileMenu");
    if(mobile && !mobile.querySelector(".mobile-compare-link")){
      const a=document.createElement("a"); a.href=compareHref(); a.className="mobile-compare-link"; mobile.appendChild(a);
    }
  }

  function slugFromCard(card){
    const link=card.querySelector('a[href*="properties/"]');
    const match=link?.getAttribute("href")?.match(/properties\/([^/?#]+)\.html/i);
    return match?.[1] || null;
  }
  function makeToggle(slug, detail=false){
    const btn=document.createElement("button"); btn.type="button"; btn.className="compare-toggle-btn"; btn.dataset.compareSlug=slug;
    if(detail) btn.classList.add("detail-compare-btn");
    btn.innerHTML='<span class="compare-check"></span><span class="compare-button-label"></span>';
    btn.addEventListener("click",event=>{ event.preventDefault(); event.stopPropagation(); toggle(slug); });
    return btn;
  }
  function decorateCards(){
    document.querySelectorAll(".property-card,.saved-card").forEach(card=>{
      if(card.querySelector("[data-compare-slug]")) return;
      const slug=slugFromCard(card); if(!slug||!property(slug)) return;
      const btn=makeToggle(slug);
      if(card.classList.contains("saved-card")) (card.querySelector(".saved-card-body")||card).appendChild(btn); else card.appendChild(btn);
    });
  }
  function decorateDetail(){
    if(!inProperties) return;
    const slug=location.pathname.split("/").pop().replace(/\.html$/i,""); if(!property(slug)) return;
    const actions=document.querySelector(".detail-actions"); if(actions && !actions.querySelector("[data-compare-slug]")) actions.appendChild(makeToggle(slug,true));
  }
  function updateButtons(){
    const c=t();
    document.querySelectorAll("[data-compare-slug]").forEach(btn=>{
      const active=selected(btn.dataset.compareSlug); btn.classList.toggle("is-comparing",active); btn.setAttribute("aria-pressed",String(active));
      const label=btn.querySelector(".compare-button-label"); if(label) label.textContent=active?c.added:c.add;
    });
  }
  function updateNav(){
    const c=t(), count=read().length;
    document.querySelectorAll(".compare-count").forEach(el=>el.textContent=count);
    document.querySelectorAll(".compare-nav-label,.mobile-compare-link").forEach(el=>el.textContent=c.compare);
  }

  function renderDock(){
    let dock=document.querySelector(".compare-dock");
    if(document.body.classList.contains("compare-page")){ dock?.remove(); return; }
    if(!dock){
      dock=document.createElement("div"); dock.className="compare-dock";
      dock.innerHTML='<div class="compare-dock-items"></div><button class="compare-dock-action" type="button"></button>';
      document.body.appendChild(dock);
      dock.querySelector(".compare-dock-action").addEventListener("click",()=>location.href=compareHref());
    }
    const items=read().map(property).filter(Boolean); const list=dock.querySelector(".compare-dock-items");
    list.innerHTML=items.map(p=>`<div class="compare-dock-item"><span class="compare-dock-thumb" style="background-image:url('${p.image}')"></span><span class="compare-dock-name">${p.title}</span><button class="compare-dock-remove" type="button" data-remove-compare="${p.slug}" aria-label="${t().remove} ${p.title}">×</button></div>`).join("");
    list.querySelectorAll("[data-remove-compare]").forEach(btn=>btn.addEventListener("click",()=>remove(btn.dataset.removeCompare)));
    dock.querySelector(".compare-dock-action").textContent=`${t().compareNow} (${items.length}/${MAX})`;
    dock.classList.toggle("show",items.length>0);
  }

  function renderComparePage(){
    if(!document.body.classList.contains("compare-page")) return;
    const c=t(), items=read().map(property).filter(Boolean), table=document.getElementById("compareTable"), empty=document.getElementById("compareEmpty"), status=document.getElementById("compareStatus"), clear=document.getElementById("compareClear");
    document.documentElement.lang=language();
    document.querySelectorAll("[data-compare-copy]").forEach(el=>{const key=el.dataset.compareCopy;if(c[key] && typeof c[key]!=="function")el.textContent=c[key];});
    const langBtn=document.getElementById("languageToggle"); if(langBtn)langBtn.textContent=language().toUpperCase();
    const curBtn=document.getElementById("currencyToggle"); if(curBtn)curBtn.textContent=currency();
    if(status) status.textContent=items.length===1?c.statusOne:c.statusMany(items.length);
    if(clear) clear.disabled=items.length===0;
    if(empty) empty.hidden=items.length!==0;
    if(table) table.hidden=items.length===0;
    if(!table||!items.length) return;
    table.style.setProperty("--compare-columns",items.length);
    const head=`<div class="compare-row"><div class="compare-cell compare-label">${c.compare}</div>${items.map(p=>`<div class="compare-cell compare-property-head"><div class="compare-head-image" style="background-image:url('${p.image}')"></div><div class="compare-head-body"><div class="compare-head-meta">${p.location} · ${p.type}</div><div class="compare-head-title">${p.title}</div><div class="compare-head-price">${money(p)} <small>${suffix(p)}</small></div><div class="compare-head-actions"><a href="properties/${p.slug}.html">${c.view}</a><button type="button" data-remove-page="${p.slug}">${c.remove}</button></div></div></div>`).join("")}</div>`;
    const row=(label,fn)=>`<div class="compare-row"><div class="compare-cell compare-label">${label}</div>${items.map(p=>`<div class="compare-cell compare-value">${fn(p)??c.none}</div>`).join("")}</div>`;
    table.innerHTML=head+
      row(c.price,p=>`<strong>${money(p)}</strong>&nbsp; ${suffix(p)}`)+
      row(c.location,p=>p.location)+row(c.type,p=>p.type)+row(c.purpose,p=>purpose(p))+
      row(c.beds,p=>p.beds??c.none)+row(c.baths,p=>p.baths??c.none)+row(c.area,p=>p.area)+row(c.tenure,p=>tenure(p))+row(c.reference,p=>p.ref);
    table.querySelectorAll("[data-remove-page]").forEach(btn=>btn.addEventListener("click",()=>remove(btn.dataset.removePage)));
  }

  function refresh(){ injectNav(); decorateCards(); decorateDetail(); updateButtons(); updateNav(); renderDock(); renderComparePage(); }

  ensureStyle();
  injectNav();
  const observer=new MutationObserver(()=>{ decorateCards(); decorateDetail(); updateButtons(); });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.getElementById("languageToggle")?.addEventListener("click",()=>setTimeout(refresh,0));
  document.getElementById("currencyToggle")?.addEventListener("click",()=>setTimeout(refresh,0));
  document.getElementById("compareClear")?.addEventListener("click",()=>{write([]);refresh();});
  refresh();
  window.addEventListener("storage",refresh);
})();
