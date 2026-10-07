(() => {
  const RECENT_KEY="aup-recent-properties-v1";
  const inPropertyPage=location.pathname.includes("/properties/");
  const base=inPropertyPage?"../":"";
  const fallbackCatalog=[];
  const copy={
    en:{filter:"Filters",filters:"More filters",location:"Location",allLocations:"All locations",purpose:"Purpose",allPurpose:"Sale & rent",sale:"For sale",rent:"For rent",minPrice:"Min price",maxPrice:"Max price",bedrooms:"Bedrooms",anyBeds:"Any",bedPlus:n=>`${n}+ beds`,reset:"Reset",results:n=>`${n} ${n===1?"property":"properties"}`,ask:"Ask directly",recentEyebrow:"Continue exploring",recentTitle:"Recently viewed",clearRecent:"Clear history",viewAgain:"View again",directMessage:p=>`Hi, I am interested in ${p.title} in ${p.location}. Please share the latest availability and details.`,kostInterest:"Kost / Boarding House"},
    id:{filter:"Filter",filters:"Filter lainnya",location:"Lokasi",allLocations:"Semua lokasi",purpose:"Tujuan",allPurpose:"Jual & sewa",sale:"Dijual",rent:"Disewa",minPrice:"Harga minimum",maxPrice:"Harga maksimum",bedrooms:"Kamar tidur",anyBeds:"Semua",bedPlus:n=>`${n}+ kamar`,reset:"Reset",results:n=>`${n} properti`,ask:"Tanya langsung",recentEyebrow:"Lanjutkan pencarian",recentTitle:"Terakhir dilihat",clearRecent:"Hapus riwayat",viewAgain:"Lihat lagi",directMessage:p=>`Halo, saya tertarik dengan ${p.title} di ${p.location}. Mohon info ketersediaan dan detail terbarunya.`,kostInterest:"Kos / Kamar Bulanan"}
  };
  const advanced={minUsd:null,maxUsd:null,minBeds:0};
  let renderTimer=null;

  function lang(){return localStorage.getItem("aup-language")||"en"}
  function currencyNow(){return localStorage.getItem("aup-currency")||"USD"}
  function t(){return copy[lang()]||copy.en}
  function catalog(){
    try{if(typeof properties!=="undefined"&&Array.isArray(properties))return properties}catch{}
    return window.AUPCatalog?.items||fallbackCatalog;
  }
  function propertyBySlug(slug){return catalog().find(p=>p.slug===slug)}
  function money(p){return AUPCatalog.money(p)}
  function priceSuffix(p){return AUPCatalog.suffix(p)}
  function propertyHref(slug){return AUPCatalog.href(slug)}


  function ensureStyle(){
    if(document.querySelector("link[data-catalog-features-style]"))return;
    const link=document.createElement("link");link.rel="stylesheet";link.href=`${base}catalog-features.css`;link.dataset.catalogFeaturesStyle="true";document.head.appendChild(link)
  }

  function readRecent(){
    try{const parsed=JSON.parse(localStorage.getItem(RECENT_KEY)||"[]");return Array.isArray(parsed)?parsed.filter(x=>typeof x==="string"):[]}catch{return[]}
  }
  function writeRecent(items){try{localStorage.setItem(RECENT_KEY,JSON.stringify([...new Set(items)].slice(0,8)))}catch{}}
  function recordRecent(slug){
    if(!propertyBySlug(slug))return;
    const items=readRecent().filter(x=>x!==slug);items.unshift(slug);writeRecent(items);renderRecentlyViewed()
  }
  function clearRecent(){try{localStorage.removeItem(RECENT_KEY)}catch{}renderRecentlyViewed()}

  function slugFromUrl(raw){return AUPCatalog.slugFromURL(raw)}
  function bindRecentTracking(){
    document.addEventListener("click",event=>{
      const target=event.target.closest?.("a[href*='property.html'],[data-property-url]");if(!target)return;
      const slug=slugFromUrl(target.getAttribute("href")||target.dataset.propertyUrl);if(slug)recordRecent(slug)
    },{capture:true});
    if(inPropertyPage){const slug=location.pathname.split("/").pop().replace(/\.html$/i,"");recordRecent(slug)}
  }

  function ensureRecentSection(){
    if(inPropertyPage||!document.getElementById("properties"))return null;
    let section=document.getElementById("recentlyViewed");
    if(section)return section;
    section=document.createElement("section");section.id="recentlyViewed";section.className="recently-viewed-section shell";section.hidden=true;
    section.innerHTML='<div class="recent-heading"><div><p id="recentEyebrow"></p><h2 id="recentTitle"></h2></div><button class="recent-clear" id="recentClear" type="button"></button></div><div class="recent-grid" id="recentGrid"></div>';
    document.getElementById("properties").insertAdjacentElement("afterend",section);
    section.querySelector("#recentClear")?.addEventListener("click",clearRecent);
    return section
  }
  function renderRecentlyViewed(){
    const section=ensureRecentSection();if(!section)return;
    const items=readRecent().map(propertyBySlug).filter(Boolean).slice(0,4),c=t();
    section.hidden=items.length===0;if(!items.length)return;
    section.querySelector("#recentEyebrow").textContent=c.recentEyebrow;section.querySelector("#recentTitle").textContent=c.recentTitle;section.querySelector("#recentClear").textContent=c.clearRecent;
    const grid=section.querySelector("#recentGrid");grid.innerHTML=items.map(AUPCatalog.view).map(p=>`<article class="recent-card"><a class="recent-image" href="${propertyHref(p.slug)}" style="background-image:url('${p.image}')" aria-label="${p.title}"></a><div class="recent-body"><span class="recent-meta">${p.location} · ${p.type}</span><a class="recent-title" href="${propertyHref(p.slug)}">${p.title}</a><div class="recent-bottom"><span class="recent-price"><strong>${money(p)}</strong><small>${priceSuffix(p)}</small></span><span class="recent-actions"><a href="${propertyHref(p.slug)}">${c.viewAgain}</a><button type="button" data-recent-inquiry="${p.slug}">${c.ask}</button></span></div></div></article>`).join("");
    grid.querySelectorAll("[data-recent-inquiry]").forEach(btn=>btn.addEventListener("click",()=>startDirectInquiry(btn.dataset.recentInquiry)))
  }

  function findInterestOption(select,p){
    if(!select)return null;
    const desired=p.type==="Kost"?["Kost / Boarding House","Kos / Kamar Bulanan","Kost","Kos"]:[p.type];
    return [...select.options].find(o=>desired.includes(o.value)||desired.includes(o.textContent.trim()))||null
  }
  function startDirectInquiry(slug){
    const p=propertyBySlug(slug);if(!p)return;
    const homeForm=document.getElementById("contactForm");
    if(homeForm){
      const select=homeForm.querySelector('select[name="interest"]');const option=findInterestOption(select,p);if(option)select.value=option.value;
      const message=homeForm.querySelector('textarea[name="message"]');if(message)message.value=t().directMessage(p);
      homeForm.classList.remove("catalog-form-highlight");void homeForm.offsetWidth;homeForm.classList.add("catalog-form-highlight");
      document.getElementById("contact")?.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>homeForm.querySelector('input[name="name"]')?.focus({preventScroll:true}),500);return
    }
    const detailForm=document.getElementById("inquiryForm");
    if(detailForm){const message=detailForm.querySelector("textarea");if(message&&!message.value)message.value=t().directMessage(p);detailForm.classList.remove("catalog-form-highlight");void detailForm.offsetWidth;detailForm.classList.add("catalog-form-highlight");detailForm.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>detailForm.querySelector('input[type="text"]')?.focus({preventScroll:true}),450)}
  }

  function decorateCards(){
    if(inPropertyPage)return;
    document.querySelectorAll(".property-card").forEach(card=>{
      if(card.querySelector(".catalog-card-actions"))return;
      const view=card.querySelector("[data-property-url]");const link=card.querySelector("a.property-image");const slug=slugFromUrl(view?.dataset.propertyUrl||link?.getAttribute("href"));if(!view||!slug)return;
      const actions=document.createElement("div");actions.className="catalog-card-actions";
      view.classList.add("catalog-view-action");view.textContent=(lang()==="id"?"Lihat detail":"View details");
      const ask=document.createElement("button");ask.type="button";ask.className="catalog-direct-inquiry";ask.dataset.directInquiry=slug;ask.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.38 8.38 0 0 1 12.5 3h.5a8.48 8.48 0 0 1 8 8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>';ask.querySelector("span").textContent=t().ask;ask.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();startDirectInquiry(slug)});
      view.parentNode.insertBefore(actions,view);actions.appendChild(view);actions.appendChild(ask)
    })
  }
  function refreshCardCopy(){
    document.querySelectorAll(".catalog-direct-inquiry span").forEach(el=>el.textContent=t().ask);
    document.querySelectorAll(".catalog-view-action").forEach(el=>el.textContent=lang()==="id"?"Lihat detail":"View details")
  }
  function enhanceDetailInquiry(){
    if(!inPropertyPage)return;
    const slug=location.pathname.split("/").pop().replace(/\.html$/i,"");const button=document.getElementById("detailInquiry");if(!button||button.dataset.catalogInquiryBound)return;button.dataset.catalogInquiryBound="true";button.addEventListener("click",()=>{const p=propertyBySlug(slug),area=document.querySelector("#inquiryForm textarea");if(p&&area&&!area.value)area.value=t().directMessage(p)})
  }

  function normalizePriceInput(value){const n=Number(value);return value.trim()!==''&&Number.isFinite(n)&&n>=0?n:null}
  function displayPriceFilter(value){return value==null?'':String(value)}
  function passesAdvanced(p){
    if((advanced.minUsd!=null||advanced.maxUsd!=null)&&(p.price==null||p.currency!==currencyNow()))return false;
    if(advanced.minUsd!=null&&Number(p.price)<advanced.minUsd)return false;
    if(advanced.maxUsd!=null&&Number(p.price)>advanced.maxUsd)return false;
    if(advanced.minBeds>0&&Number(p.beds||0)<advanced.minBeds)return false;
    return true
  }

  function ensureAdvancedFilter(){
    const row=document.getElementById("filterRow");if(!row||document.getElementById("catalogFilterWrap"))return;
    const wrap=document.createElement("div");wrap.className="catalog-filter-wrap";wrap.id="catalogFilterWrap";
    wrap.innerHTML='<div class="catalog-filter-toolbar"><span class="catalog-filter-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span id="catalogFilterTitle"></span></span><button class="catalog-filter-toggle" id="catalogFilterToggle" type="button"></button><span class="catalog-filter-count" id="catalogFilterCount"></span><button class="catalog-filter-reset" id="catalogFilterReset" type="button"></button></div><div class="catalog-filter-panel" id="catalogFilterPanel"><label class="catalog-filter-field"><span id="catalogLocationLabel"></span><select class="catalog-filter-control" id="catalogLocation"></select></label><label class="catalog-filter-field"><span id="catalogPurposeLabel"></span><select class="catalog-filter-control" id="catalogPurpose"></select></label><label class="catalog-filter-field"><span id="catalogMinLabel"></span><div class="catalog-price-input"><input class="catalog-filter-control" id="catalogMinPrice" inputmode="numeric"><span class="catalog-currency-tag"></span></div></label><label class="catalog-filter-field"><span id="catalogMaxLabel"></span><div class="catalog-price-input"><input class="catalog-filter-control" id="catalogMaxPrice" inputmode="numeric"><span class="catalog-currency-tag"></span></div></label><label class="catalog-filter-field"><span id="catalogBedsLabel"></span><select class="catalog-filter-control" id="catalogBeds"></select></label></div>';
    row.insertAdjacentElement("afterend",wrap);
    const note=document.createElement('p');note.id='catalogCurrencyNote';note.className='catalog-price-note';wrap.appendChild(note);
    wrap.querySelector("#catalogFilterToggle")?.addEventListener("click",()=>wrap.classList.toggle("is-open"));
    wrap.querySelector("#catalogFilterReset")?.addEventListener("click",resetAdvancedFilters);
    wrap.querySelector("#catalogLocation")?.addEventListener("change",e=>{try{searchFilters.location=e.target.value}catch{}const hero=document.getElementById("locationFilter");if(hero)hero.value=e.target.value;requestRender()});
    wrap.querySelector("#catalogPurpose")?.addEventListener("change",e=>{try{searchFilters.purpose=e.target.value}catch{}const hero=document.getElementById("purposeFilter");if(hero)hero.value=e.target.value;requestRender()});
    wrap.querySelector("#catalogBeds")?.addEventListener("change",e=>{advanced.minBeds=Number(e.target.value||0);requestRender()});
    const bindPrice=(id,key)=>{const input=wrap.querySelector(id);input?.addEventListener("input",()=>{advanced[key]=normalizePriceInput(input.value);clearTimeout(renderTimer);renderTimer=setTimeout(requestRender,220)})};
    bindPrice("#catalogMinPrice","minUsd");bindPrice("#catalogMaxPrice","maxUsd");
    updateAdvancedFilterCopy()
  }
  function updateAdvancedFilterCopy(){
    const wrap=document.getElementById("catalogFilterWrap");if(!wrap)return;const c=t();
    const set=(id,text)=>{const el=wrap.querySelector(id);if(el)el.textContent=text};
    set("#catalogFilterTitle",c.filter);set("#catalogFilterToggle",c.filters);set("#catalogFilterReset",c.reset);set("#catalogLocationLabel",c.location);set("#catalogPurposeLabel",c.purpose);set("#catalogMinLabel",c.minPrice);set("#catalogMaxLabel",c.maxPrice);set("#catalogBedsLabel",c.bedrooms);
    const location=wrap.querySelector("#catalogLocation");if(location){const current=(()=>{try{return searchFilters.location}catch{return "all"}})();const locations=[...new Set(catalog().map(p=>p.location).filter(Boolean))].sort();location.innerHTML=`<option value="all">${c.allLocations}</option>${locations.map(x=>`<option value="${AUPCatalog.escape(x)}">${AUPCatalog.escape(x)}</option>`).join("")}`;location.value=current||"all"}
    const purpose=wrap.querySelector("#catalogPurpose");if(purpose){const current=(()=>{try{return searchFilters.purpose}catch{return "all"}})();purpose.innerHTML=`<option value="all">${c.allPurpose}</option><option value="sale">${c.sale}</option><option value="rent">${c.rent}</option>`;purpose.value=current||"all"}
    const beds=wrap.querySelector("#catalogBeds");if(beds){beds.innerHTML=`<option value="0">${c.anyBeds}</option>${[1,2,3,4].map(n=>`<option value="${n}">${c.bedPlus(n)}</option>`).join("")}`;beds.value=String(advanced.minBeds)}
    wrap.querySelectorAll(".catalog-currency-tag").forEach(el=>el.textContent=currencyNow());
    const min=wrap.querySelector("#catalogMinPrice"),max=wrap.querySelector("#catalogMaxPrice");if(min&&document.activeElement!==min)min.value=displayPriceFilter(advanced.minUsd);if(max&&document.activeElement!==max)max.value=displayPriceFilter(advanced.maxUsd);
    const note=document.getElementById('catalogCurrencyNote');if(note)note.textContent=lang()==='id'?'Harga mengikuti mata uang listing. Filter harga menggunakan '+currencyNow()+'.':'Prices use each listing’s currency. Price filters use '+currencyNow()+'.';
    updateResultCount()
  }
  function resetAdvancedFilters(){
    advanced.minUsd=null;advanced.maxUsd=null;advanced.minBeds=0;
    try{searchFilters.location="all";searchFilters.type="all";searchFilters.purpose="all";activeType="all"}catch{}
    document.querySelectorAll(".filter-chip").forEach(chip=>chip.classList.toggle("active",chip.dataset.filter==="all"));
    ["locationFilter","typeFilter","purposeFilter"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="all"});updateAdvancedFilterCopy();requestRender()
  }
  function updateResultCount(){const el=document.getElementById("catalogFilterCount");if(!el)return;let count=0;try{count=catalog().filter(p=>typeof isVisible==="function"?isVisible(p):passesAdvanced(p)).length}catch{count=catalog().filter(passesAdvanced).length}el.textContent=t().results(count)}
  function requestRender(){try{if(typeof renderProperties==="function")renderProperties()}catch{}updateResultCount()}

  function patchCatalogRendering(){
    try{
      if(typeof isVisible==="function"&&!isVisible.__catalogFeaturesPatched){const coreVisible=isVisible;const wrapped=function(p){return coreVisible(p)&&passesAdvanced(p)};wrapped.__catalogFeaturesPatched=true;isVisible=wrapped}
      if(typeof renderProperties==="function"&&!renderProperties.__catalogFeaturesPatched){const coreRender=renderProperties;const wrapped=function(){const out=coreRender();decorateCards();refreshCardCopy();updateResultCount();return out};wrapped.__catalogFeaturesPatched=true;renderProperties=wrapped}
    }catch{}
  }

  function syncFromHero(){
    const form=document.getElementById("heroSearch");form?.addEventListener("submit",()=>setTimeout(()=>{updateAdvancedFilterCopy();updateResultCount()},0))
  }
  function bindPreferenceRefresh(){
    document.getElementById("languageToggle")?.addEventListener("click",()=>setTimeout(()=>{updateAdvancedFilterCopy();refreshCardCopy();renderRecentlyViewed()},0));
    document.getElementById("currencyToggle")?.addEventListener("click",()=>setTimeout(()=>{updateAdvancedFilterCopy();renderRecentlyViewed()},0));
    window.addEventListener("storage",event=>{if(!event.key||[RECENT_KEY,"aup-language","aup-currency"].includes(event.key)){updateAdvancedFilterCopy();renderRecentlyViewed()}})
  }

  ensureStyle();bindRecentTracking();enhanceDetailInquiry();
  if(!inPropertyPage){patchCatalogRendering();ensureAdvancedFilter();syncFromHero();renderRecentlyViewed();decorateCards();setTimeout(()=>{decorateCards();updateResultCount();renderRecentlyViewed()},650)}
  document.addEventListener('aup:properties-rendered',()=>{updateAdvancedFilterCopy();renderRecentlyViewed();requestRender()});
  bindPreferenceRefresh();
})();
