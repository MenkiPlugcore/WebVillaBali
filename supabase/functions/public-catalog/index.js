import {publicSettings} from './settings.js';
const origins = ['https://webvillabali.menkiestes.workers.dev', 'https://agungubudproperty.com', 'https://www.agungubudproperty.com'];
const fields = 'id,slug,title_id,title_en,description_id,description_en,property_type,purpose,price,currency,price_period,tenure,bedrooms,bathrooms,land_area_m2,building_area_m2,facilities,address_public,availability,is_featured,locations(name),property_images(id,alt_id,alt_en,is_cover,sort_order)';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function handle(req, env) {
  const origin = req.headers.get('origin');
  const headers = {'Access-Control-Allow-Origin': origins.includes(origin) ? origin : origins[0], 'Access-Control-Allow-Methods':'GET,OPTIONS', 'Access-Control-Allow-Headers':'apikey,content-type', 'Vary':'Origin', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'};
  const reply = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{...headers,'Content-Type':'application/json'}});
  if (origin && !origins.includes(origin)) return reply({error:'Origin ditolak.'},403);
  if (req.method === 'OPTIONS') return new Response(null,{headers});
  if (req.method !== 'GET') return reply({error:'Metode tidak tersedia.'},405);
  const url = new URL(req.url);
  const motor=url.searchParams.get('kind')==='motorbike';
  const table=motor?'motorbikes':'properties',imageTable=motor?'motorbike_images':'property_images',parentKey=motor?'motorbike_id':'property_id';
  // Always read the database as anonymous. Ignore caller JWTs, including staff JWTs.
  const anonHeaders = {apikey:env.anon, Authorization:'Bearer '+env.anon};
  async function read(table, params) {
    const res = await fetch(env.url+'/rest/v1/'+table+'?'+new URLSearchParams(params), {headers:anonHeaders});
    if (!res.ok) throw Error('Catalog read failed ('+res.status+').');
    return res.json();
  }
  try {
    if(url.searchParams.get('kind')==='settings'){const rows=await read('site_settings',{key:'in.(contact,social_links)',select:'key,value',order:'key.asc'});return reply({settings:publicSettings(rows)});}
    if (url.searchParams.get('image')) {
      const id = url.searchParams.get('image');
      if (!uuid.test(id)) return reply({error:'Foto tidak ditemukan.'},404);
      const [image] = await read(imageTable,{id:'eq.'+id,select:'storage_path,'+parentKey,limit:'1'});
      if (!image) return reply({error:'Foto tidak ditemukan.'},404);
      const [parent] = await read(table,{id:'eq.'+image[parentKey],publication_status:'eq.published',select:'id',limit:'1'});
      if (!parent) return reply({error:'Foto tidak ditemukan.'},404);
      // No caller-supplied path is ever signed. The bucket remains private.
      if (!(new RegExp('^'+table+'/[0-9a-f-]+/[0-9a-f-]+\\.(jpg|png|webp)$','i')).test(image.storage_path)) return reply({error:'Foto tidak ditemukan.'},404);
      const signed = await fetch(env.url+'/storage/v1/object/sign/aup-media/'+image.storage_path,{method:'POST',headers:{apikey:env.key,Authorization:'Bearer '+env.key,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:300})});
      if (!signed.ok) throw Error('Image signing failed.');
      const data = await signed.json();
      const path = data.signedURL || data.signedUrl;
      if (!path?.startsWith('/object/sign/aup-media/')) throw Error('Invalid signed image URL.');
      return new Response(null,{status:302,headers:{...headers,Location:env.url+'/storage/v1'+path}});
    }
    const slug = url.searchParams.get('slug');
    if (slug !== null && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return reply({error:'Properti tidak ditemukan.'},404);
    const rawPage = url.searchParams.get('page') || '0';
    if (!/^\d{1,6}$/.test(rawPage)) return reply({error:'Halaman tidak valid.'},400);
    const page = Number(rawPage);
    const bikeFields='id,slug,name,description_id,description_en,daily_price,monthly_price,currency,engine_cc,included_items,availability,motorbike_images(id,alt_id,alt_en,is_cover,sort_order)';
    const params = {select:motor?bikeFields:fields,publication_status:'eq.published',order:motor?'sort_order.asc,created_at.desc,id.asc':'is_featured.desc,created_at.desc,id.asc',limit:slug?'1':'100',offset:slug?'0':String(page*100)};
    if (slug) params.slug = 'eq.'+slug;
    const rows = await read(table,params);
    if (slug && !rows.length) return reply({error:'Properti tidak ditemukan.'},404);
    const imageKey=motor?'motorbike_images':'property_images';
    for (const row of rows) row[imageKey] = (row[imageKey]||[]).sort((a,b)=>Number(b.is_cover)-Number(a.is_cover)||a.sort_order-b.sort_order);
    return reply({[motor?'motorbikes':'properties']:rows,hasMore:!slug&&rows.length===100});
  } catch (error) {
    console.error('public-catalog failed',error.message);
    return reply({error:'Katalog belum bisa dimuat. Coba lagi.'},503);
  }
}
if (typeof Deno !== 'undefined') Deno.serve(req=>handle(req,{url:Deno.env.get('SUPABASE_URL'),anon:Deno.env.get('SUPABASE_ANON_KEY'),key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}));
