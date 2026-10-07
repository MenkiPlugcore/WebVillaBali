const origins=['https://webvillabali.menkiestes.workers.dev','https://agungubudproperty.com','https://www.agungubudproperty.com'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text=(value,max)=>{if(typeof value!=='string'||value.length>max)throw Error('INPUT');return value.trim();};
export function validate(body,now=Date.now()){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('INPUT');
 if(body.website)throw Error('INPUT');
 if(!uuid.test(body.request_id||'')||!Number.isFinite(body.started_at)||now-body.started_at<1500||body.started_at>now)throw Error('INPUT');
 const name=text(body.name,150),email=body.email?text(body.email,254).toLowerCase():null,phone=body.phone?text(body.phone,40):null,message=text(body.message??'',4000);
 if(!name||!message||(!email&&!phone))throw Error('INPUT');
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('INPUT');
 if(phone&&(!/^[+\d\s().-]+$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15))throw Error('INPUT');
 const data={name,email,phone:phone?phone.replace(/[\s().-]/g,''):null,message,language:body.language==='id'?'id':'en',inquiry_type:'general'};
 if(body.inquiry_type==='service'){if(!uuid.test(body.service_id||''))throw Error('INPUT');data.inquiry_type='service';data.service_id=body.service_id;}
 if(body.inquiry_type==='property'){if(!uuid.test(body.property_id||''))throw Error('INPUT');data.inquiry_type='property';data.property_id=body.property_id;}
 if(body.inquiry_type==='motorbike'){
  if(!uuid.test(body.motorbike_id||'')||!['daily','monthly'].includes(body.plan)||!Number.isInteger(body.duration)||body.duration<1||body.duration>(body.plan==='daily'?365:24))throw Error('INPUT');
  const start=text(body.start,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||new Date(start+'T00:00:00Z').toISOString().slice(0,10)!==start||start<new Date(now+8*3600000).toISOString().slice(0,10))throw Error('INPUT');
  data.inquiry_type='motorbike';data.motorbike_id=body.motorbike_id;return {data,booking:{plan:body.plan,duration:body.duration,start,area:text(body.area??'',180)}};
 }
 if(body.interest&&data.inquiry_type==='general')data.message='Interest: '+text(body.interest,150)+'\n'+message;
 return {data};
}
async function boundedJSON(req){const reader=req.body?.getReader();if(!reader)throw Error('INPUT');const chunks=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw Error('SIZE');}chunks.push(value);}const all=new Uint8Array(size);let offset=0;for(const part of chunks){all.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(all));}
export async function handle(req,env){
 const origin=req.headers.get('origin'),headers={'Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'content-type,apikey','Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 const reply=(status,error,ticket)=>new Response(JSON.stringify(status===200?{success:true,ticket_no:ticket}:{error}),{status,headers:{...headers,'Content-Type':'application/json',...(status===429?{'Retry-After':'600'}:{})}});
 if(!origins.includes(origin))return reply(403,'Origin ditolak.');
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply(405,'Metode tidak tersedia.');
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply(415,'Gunakan JSON.');
 try{
  const body=await boundedJSON(req),{data,booking}=validate(body);
  const anon={apikey:env.anon,Authorization:'Bearer '+env.anon};
  async function record(table,id,fields){const res=await fetch(env.url+'/rest/v1/'+table+'?'+new URLSearchParams({id:'eq.'+id,publication_status:'eq.published',select:fields,limit:'1'}),{headers:anon});if(!res.ok)throw Error('SERVER');return (await res.json())[0];}
  if(data.inquiry_type==='service'){const service=await record('services',data.service_id,'title_id,title_en');if(!service)return reply(404,'Layanan tidak tersedia.');data.message='Service: '+(service['title_'+data.language]||service.title_en)+'\n'+data.message;}
  if(data.inquiry_type==='property'){const property=await record('properties',data.property_id,'title_id,title_en');if(!property)return reply(404,'Properti tidak tersedia.');data.message='Property: '+(property['title_'+data.language]||property.title_en)+'\n'+data.message;}
  if(booking){const bike=await record('motorbikes',data.motorbike_id,'name,daily_price,monthly_price,currency,availability');if(!bike||bike.availability!=='available')return reply(404,'Motor tidak tersedia.');const rate=booking.plan==='daily'?bike.daily_price:bike.monthly_price;const estimate=rate==null?'Confirm with team':new Intl.NumberFormat(bike.currency==='IDR'?'id-ID':'en-US',{style:'currency',currency:bike.currency}).format(Number(rate)*booking.duration);data.message=`Motorbike: ${bike.name}\nPlan: ${booking.plan} · ${booking.duration}\nStart: ${booking.start}\nPickup / delivery: ${booking.area||'-'}\nEstimated total: ${estimate} (subject to team confirmation)\n\n${data.message}`;}
  const secret=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const fingerprint=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',secret,new TextEncoder().encode(data.email||data.phone)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
  const saved=await fetch(env.url+'/rest/v1/rpc/submit_inquiry',{method:'POST',headers:{apikey:env.key,Authorization:'Bearer '+env.key,'Content-Type':'application/json'},body:JSON.stringify({p_request_id:body.request_id,p_contact_hash:fingerprint,p_data:data})});
  if(!saved.ok)throw Error('SERVER');const result=await saved.json();
  if(result.status===200&&!/^AUP-[0-9]+$/.test(result.ticket_no||''))throw Error('SERVER');
  return reply(result.status,result.status===429?'Terlalu banyak pesan. Coba lagi nanti.':result.status===409?'Pesan berubah. Silakan kirim ulang.':result.status===404?'Listing tidak tersedia.':'Periksa isian formulir.',result.ticket_no);
 }catch(error){if(error.message==='SIZE')return reply(413,'Pesan terlalu besar.');if(error.message==='INPUT'||error instanceof SyntaxError||error instanceof RangeError)return reply(400,'Periksa nama, kontak, pesan, dan tanggal rental.');console.error('public-inquiry failed');return reply(503,'Pesan belum bisa dikirim. Coba lagi; isianmu tetap tersimpan.');}
}
if(typeof Deno!=='undefined')Deno.serve(req=>handle(req,{url:Deno.env.get('SUPABASE_URL'),anon:Deno.env.get('SUPABASE_ANON_KEY'),key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}));
