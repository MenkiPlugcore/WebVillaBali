(() => {
  const endpoint='https://tvcmwkzwemrwwewphfgh.supabase.co/functions/v1/public-catalog';
  const placeholder='/assets/property-placeholder.svg';
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const language=()=>localStorage.getItem('aup-language')==='id'?'id':'en';
  const labels={villa:'Villa',house:'House',land:'Land',rental:'Rental',commercial:'Commercial',kost:'Kost'};
  const title=(p,lang=language())=>p['title_'+lang]||p.title_en||p.title_id||p.title||'';
  const description=(p,lang=language())=>p['description_'+lang]||p.description_en||p.description_id||'';
  const href=slug=>'/property.html?slug='+encodeURIComponent(slug);
  const image=id=>id?endpoint+'?image='+encodeURIComponent(id):placeholder;
  const slugFromURL=raw=>{try{const url=new URL(raw,location.href);return url.pathname.endsWith('/property.html')?url.searchParams.get('slug'):url.pathname.match(/\/properties\/([^/]+)\.html$/)?.[1]||null;}catch{return null;}};
  function map(row){return {...row,title:title(row),type:labels[row.property_type]||row.property_type,location:row.locations?.name||'Bali',beds:row.bedrooms,baths:row.bathrooms,area:(row.building_area_m2??row.land_area_m2)!=null?(row.building_area_m2??row.land_area_m2)+' m²':'',featured:row.is_featured,image:image(row.property_images?.[0]?.id),ref:row.slug};}
  function money(p){
    if(p.price==null)return language()==='id'?'Hubungi kami':'Price on request';
    return new Intl.NumberFormat(p.currency==='IDR'?'id-ID':'en-US',{style:'currency',currency:p.currency,maximumFractionDigits:p.currency==='IDR'?0:2}).format(p.price);
  }
  function suffix(p){const id=language()==='id';return ({night:id?'/ malam':'/ night',day:id?'/ hari':'/ day',month:id?'/ bulan':'/ month',year:id?'/ tahun':'/ year'})[p.price_period]||(p.tenure==='freehold'?(id?'Hak milik':'Freehold'):p.tenure==='leasehold'?'Leasehold':'');}
  let pending;
  async function request(params={}){const response=await fetch(endpoint+'?'+new URLSearchParams(params),{signal:AbortSignal.timeout(20000),cache:'no-store'});if(!response.ok)throw Error(response.status===404?'NOT_FOUND':'LOAD_FAILED');const data=await response.json();return {...data,properties:data.properties.map(map)};}
  async function load(){if(pending)return pending;pending=(async()=>{const rows=[];for(let page=0;;page++){const data=await request({page});rows.push(...data.properties);if(!data.hasMore)break;}api.items.splice(0,api.items.length,...rows);api.loaded=true;document.dispatchEvent(new CustomEvent('aup:catalog-loaded'));return rows;})().catch(error=>{pending=null;throw error;});return pending;}
  const api={endpoint,placeholder,escape,language,title,description,href,image,slugFromURL,money,suffix,items:[],loaded:false,load,detail:slug=>request({slug}).then(data=>data.properties[0]),view:p=>({...p,title:escape(title(p)),location:escape(p.location),type:escape(p.type),area:escape(p.area),ref:escape(p.ref)})};
  window.AUPCatalog=api;
})();
