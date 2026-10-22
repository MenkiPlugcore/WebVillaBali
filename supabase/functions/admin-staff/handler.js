const origins=['https://webvillabali.menkiestes.workers.dev','https://agungubudproperty.com','https://www.agungubudproperty.com'];
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const role=value=>['editor','admin'].includes(value);
async function bodyJSON(req){const reader=req.body?.getReader();if(!reader)throw Error('INPUT');let size=0,parts=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw Error('LARGE');}parts.push(value);}}finally{reader.releaseLock();}const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(bytes));}
export async function handle(req,env,fetcher=fetch){
 const origin=req.headers.get('origin');const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'};
 const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(origin&&!origins.includes(origin))return reply({error:'Origin ditolak.'},403);
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Metode tidak tersedia.'},405);
 const token=req.headers.get('authorization');if(!token?.startsWith('Bearer '))return reply({error:'Silakan masuk.'},401);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Gunakan isian JSON.'},400);
 let created=false;
 try{
  const body=await bodyJSON(req);
  if(!body||typeof body!=='object'||Array.isArray(body)||!['create','activate'].includes(body.action))throw Error('INPUT');
  if(body.action==='create'&&(!role(body.role)||typeof body.email!=='string'||body.email.length>254||!body.email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)))throw Error('INPUT');
  if(body.action==='activate'&&!uuid(body.user_id))throw Error('INPUT');
  const caller={apikey:env.key,Authorization:token,'Content-Type':'application/json'};
  const service={apikey:env.key,Authorization:'Bearer '+env.key,'Content-Type':'application/json'};
  const user=await fetcher(env.url+'/auth/v1/user',{headers:caller});if(!user.ok)return reply({error:'Sesi tidak valid. Masuk ulang.'},401);
  if(!['owner','developer'].includes((await user.json()).app_metadata?.aup_role))return reply({error:'Hanya owner atau developer yang dapat mengatur akun karyawan.'},403);
  async function rpc(name,args){const r=await fetcher(env.url+'/rest/v1/rpc/'+name,{method:'POST',headers:caller,body:JSON.stringify(args)});const data=await r.json();if(!r.ok){const codes={'42501':403,'22023':400,'23505':409,'P0002':404,'54000':429};if(codes[data.code])throw Object.assign(Error(data.message),{status:codes[data.code]});throw Error('RPC');}return data;}
  const request=await rpc('begin_staff_account',body.action==='create'?{p_action:'create',p_email:body.email.trim(),p_role:body.role}:{p_action:'activate',p_user_id:body.user_id});
  if(!uuid(request.request_id)||!role(request.role)||typeof request.email!=='string')throw Error('RPC');
  let id=request.user_id;
  if(body.action==='create'){
   const r=await fetcher(env.url+'/auth/v1/admin/users',{method:'POST',headers:service,body:JSON.stringify({email:request.email,email_confirm:false,app_metadata:{aup_role:request.role,aup_staff_role:request.role,aup_staff_since:request.since,aup_staff_request:request.request_id}})});
   if(!r.ok){if(r.status===422)return reply({error:'Email sudah terdaftar atau tidak dapat dibuat. Muat ulang daftar akun.'},409);throw Error('CREATE');}
   id=(await r.json()).id;created=true;
  }
  if(!uuid(id))throw Error('RPC');
  const ready=await rpc('finish_staff_account',{p_request_id:request.request_id,p_user_id:id});
  if(ready.user_id!==id||ready.email!==request.email||!role(ready.role)||!['invite','recovery'].includes(ready.link_type))throw Error('RPC');
  const generated=await fetcher(env.url+'/auth/v1/admin/generate_link',{method:'POST',headers:service,body:JSON.stringify({type:ready.link_type,email:ready.email})});
  if(!generated.ok)throw Error('LINK');const link=await generated.json();
  if(link.id!==id||typeof link.hashed_token!=='string'||!/^[a-zA-Z0-9_-]{32,256}$/.test(link.hashed_token)||link.verification_type!==ready.link_type)throw Error('LINK');
  // Keep activation credentials out of server request URLs and unrelated responses.
  const base=origins.includes(origin)?origin:origins[0];
  return reply({success:true,created,email:ready.email,activation_url:base+'/admin/activate/#token_hash='+encodeURIComponent(link.hashed_token)+'&type='+ready.link_type});
 }catch(error){
  if(error.message==='LARGE')return reply({error:'Permintaan terlalu besar.'},413);
  if(error instanceof SyntaxError||error.message==='INPUT')return reply({error:'Periksa email, peran, dan akun yang dipilih.'},400);
  if(error.status)return reply({error:error.message,created},error.status);
  return reply({error:created?'Akun sudah dibuat, tetapi tautan aktivasi belum tersedia. Muat ulang daftar lalu pilih Buat tautan aktivasi.':'Akun atau tautan belum berhasil diproses. Muat ulang daftar sebelum mencoba lagi.',created},502);
 }
}
