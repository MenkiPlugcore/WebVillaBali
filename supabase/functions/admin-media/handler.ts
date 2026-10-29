import {imageType,staffRole,validUUID,mediaTables,validMediaPath,boundedBody} from './validation.js';
import {drainMediaCleanup,discardUpload} from '../_shared/media-cleanup.js';
const bucket='aup-media';
const allowedOrigins=['https://webvillabali.menkiestes.workers.dev','https://agungubudproperty.com','https://www.agungubudproperty.com'];
export async function handle(req:Request,env:{url:string,key:string}){
 const origin=req.headers.get('origin');
 const headers={'Access-Control-Allow-Origin':origin&&allowedOrigins.includes(origin)?origin:allowedOrigins[0],'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json'}});
 if(origin&&!allowedOrigins.includes(origin))return reply({error:'Origin ditolak.'},403);
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Metode tidak tersedia.'},405);
 const token=req.headers.get('authorization');if(!token?.startsWith('Bearer '))return reply({error:'Silakan login.'},401);
 const serverHeaders={apikey:env.key,Authorization:'Bearer '+env.key};
 try{
  const userResponse=await fetch(env.url+'/auth/v1/user',{headers:{apikey:env.key,Authorization:token}});
  if(!userResponse.ok)return reply({error:'Sesi tidak valid. Masuk ulang.'},401);
  const user=await userResponse.json();if(!staffRole(user))return reply({error:'Akses pengelola diperlukan.'},403);
  const callerHeaders={apikey:env.key,Authorization:token,'Content-Type':'application/json',Prefer:'return=representation'};
  async function request(path:string,init:RequestInit={},server=false){
   const response=await fetch(env.url+path,{...init,headers:{...(server?serverHeaders:callerHeaders),...init.headers},signal:AbortSignal.timeout(20000)});
   if(!response.ok){
    if(['/rest/v1/rpc/manage_gallery','/rest/v1/rpc/remove_gallery_photo'].includes(path)){
     const failure=await response.json().catch(()=>({}));
     if(failure.code==='22023')throw Error('GALLERY_CHANGED');if(failure.code==='P0002')throw Error('PHOTO_NOT_FOUND');if(failure.code==='42501')throw Error('ACCESS_DENIED');
    }
    throw Error('Operasi gagal ('+response.status+').');
   }
   return response.status===204?null:response.json();
  }
  if(await request('/rest/v1/rpc/staff_access',{method:'POST',body:'{}'})!==true)return reply({error:'Akses atau sesi sudah tidak aktif. Masuk ulang.'},403);
  if(Number(req.headers.get('content-length')||0)>9*1024*1024)return reply({error:'Maksimal 8 MB per foto.'},413);
  const multipart=req.headers.get('content-type')?.startsWith('multipart/form-data');
  const bytesBody=await boundedBody(req,multipart?9*1024*1024:16384);
  const bounded=new Request(req.url,{method:'POST',headers:req.headers,body:bytesBody});
  const body=multipart?await bounded.formData():await bounded.json();
  if(!multipart&&(!body||typeof body!=='object'||Array.isArray(body)))return reply({error:'Isian tidak valid.'},400);
  const get=(key:string)=>multipart?body.get(key):body[key];
  const table=get('table'),id=get('id'),action=multipart?(get('action')||'upload'):get('action');
  const site=table==='site_media',guest=table==='guest_moments';
  if(!Object.hasOwn(mediaTables,table))return reply({error:'Jenis konten tidak valid.'},400);
  if(site){
   if(id!=='rental_hero')return reply({error:'Bagian website tidak valid.'},400);
   if(!['owner','admin','developer'].includes(user.app_metadata?.aup_role))return reply({error:'Hanya owner/admin yang dapat mengubah foto utama rental.'},403);
  }else if(!(guest&&action==='upload')&&!validUUID(id))return reply({error:'ID konten tidak valid.'},400);
  if(multipart&&!['upload','replace'].includes(action))return reply({error:'Aksi tidak valid.'},400);
  const [imageTable,parent]=mediaTables[table as keyof typeof mediaTables];
  const recordKey=site?'key':'id',queryKey=site?'key=eq.rental_hero':'id=eq.'+id;
  let record;
  if(id){
   const records=await request('/rest/v1/'+table+'?'+queryKey+'&select='+recordKey+(guest||site?',storage_path':''));
   record=records[0];if(!record&&!site)return reply({error:'Konten tidak ditemukan.'},404);
  }
  if(action==='list'){
   const images=guest||site?(record?[{...record,id:site?'rental_hero':record.id}]:[]):await request('/rest/v1/'+imageTable+'?'+parent+'=eq.'+id+'&select=id,storage_path,is_cover,sort_order&order=sort_order.asc,created_at.asc,id.asc');
   if(images.some((image:any)=>!validMediaPath(table,image.storage_path,id)))return reply({error:'Lokasi foto tidak valid.'},400);
   const signed=await Promise.all(images.map(async(image:any)=>{
    const signed=await request('/storage/v1/object/sign/'+bucket+'/'+image.storage_path,{method:'POST',body:JSON.stringify({expiresIn:300}),headers:{'Content-Type':'application/json'}},true);
    const path=signed.signedURL||signed.signedUrl;if(!path?.startsWith('/object/sign/'+bucket+'/'))throw Error('Invalid signed image URL');
    return {...image,url:env.url+'/storage/v1'+path};
   }));return reply({images:signed});
  }
  if(action==='delete_record'){
   if(site||!['properties','motorbikes','guest_moments'].includes(table))return reply({error:'Aksi tidak valid.'},400);
   const removed=await request('/rest/v1/'+table+'?id=eq.'+id+'&select=id',{method:'DELETE'});
   if(!removed?.length)return reply({error:'Konten tidak ditemukan atau akses ditolak.'},404);
   return reply({success:true,...await drainMediaCleanup(env)});
  }
  if(action==='cover'||action==='reorder'){
   if(guest||site)return reply({error:'Galeri ini tidak mendukung pengaturan foto.'},400);
   const order=get('order');
   if(action==='cover'&&!validUUID(get('image_id')))return reply({error:'ID foto tidak valid.'},400);
   if(action==='reorder'&&(!Array.isArray(order)||order.length>200||order.some((value:any)=>!validUUID(value))||new Set(order).size!==order.length))return reply({error:'Urutan foto tidak valid.'},400);
   const result=await request('/rest/v1/rpc/manage_gallery',{method:'POST',body:JSON.stringify({p_table:table,p_parent:id,p_action:action,p_image:action==='cover'?get('image_id'):null,p_order:action==='reorder'?order:null})});
   return reply({success:result.success});
  }
  let previous;
  if(action==='replace'||action==='remove'){
   if(guest&&action==='remove')return reply({error:'Gunakan Hapus momen untuk menghapus foto beserta keterangannya.'},400);
   if(site||guest)previous=record;
   else{
    if(!validUUID(get('image_id')))return reply({error:'ID foto tidak valid.'},400);
    const images=await request('/rest/v1/'+imageTable+'?id=eq.'+get('image_id')+'&'+parent+'=eq.'+id+'&select=id,storage_path');previous=images[0];
   }
   if(!previous)return reply({error:'Foto tidak ditemukan.'},404);
   if(!validMediaPath(table,previous.storage_path,id))return reply({error:'Lokasi foto tidak valid.'},400);
   if((action==='replace'||get('expected_path'))&&get('expected_path')!==previous.storage_path)return reply({error:'Foto sudah berubah. Muat ulang foto, lalu coba lagi.'},409);
  }
  if(action==='remove'){
   if(site){
    const removed=await request('/rest/v1/site_media?key=eq.rental_hero&storage_path=eq.'+encodeURIComponent(previous.storage_path)+'&select=key',{method:'DELETE'});
    if(!removed?.length)return reply({error:'Foto sudah berubah. Muat ulang foto, lalu coba lagi.'},409);
   }else await request('/rest/v1/rpc/remove_gallery_photo',{method:'POST',body:JSON.stringify({p_table:table,p_parent:id,p_image:previous.id,p_expected_path:previous.storage_path})});
   return reply({success:true,...await drainMediaCleanup(env)});
  }
  if(!['upload','replace'].includes(action))return reply({error:'Aksi tidak valid.'},400);
  if(guest&&id&&action==='upload')return reply({error:'Gunakan Ganti foto untuk mengganti momen ini.'},400);
  if(site&&record&&action==='upload')return reply({error:'Foto sudah tersedia. Muat ulang lalu gunakan Ganti foto.'},409);
  const file=get('file');if(!(file instanceof File)||!file.size||file.size>8*1024*1024)return reply({error:'Pilih foto hingga 8 MB.'},400);
  const bytes=new Uint8Array(await file.arrayBuffer()),kind=imageType(bytes);
  if(!kind||kind[0]!==file.type)return reply({error:'Gunakan foto JPG, PNG, atau WebP statis hingga 40 megapiksel dan maksimal 12.000 piksel per sisi.'},400);
  const existing=await fetch(env.url+'/storage/v1/bucket/'+bucket,{headers:serverHeaders});
  if(existing.status===404||existing.status===400){
   const created=await fetch(env.url+'/storage/v1/bucket',{method:'POST',headers:{...serverHeaders,'Content-Type':'application/json'},body:JSON.stringify({id:bucket,name:bucket,public:false,file_size_limit:8*1024*1024,allowed_mime_types:['image/jpeg','image/png','image/webp']})});
   if(!created.ok&&created.status!==409)throw Error('Penyimpanan foto belum tersedia.');
  }else if(!existing.ok)throw Error('Penyimpanan foto belum tersedia.');else if((await existing.json()).public)throw Error('Bucket harus privat.');
  const recordId=id||crypto.randomUUID(),path=table+'/'+recordId+'/'+crypto.randomUUID()+'.'+kind[1];
  const upload=await fetch(env.url+'/storage/v1/object/'+bucket+'/'+path,{method:'POST',headers:{...serverHeaders,'Content-Type':kind[0],'x-upsert':'false'},body:bytes});
  if(!upload.ok)throw Error('Upload foto gagal.');
  let saved;
  try{
   if(action==='replace'){
    const target=site?'key=eq.rental_hero':'id=eq.'+(guest?id:previous.id)+(parent?'&'+parent+'=eq.'+id:'');
    saved=await request('/rest/v1/'+imageTable+'?'+target+'&storage_path=eq.'+encodeURIComponent(previous.storage_path),{method:'PATCH',body:JSON.stringify({storage_path:path,...(guest?{publication_status:'draft',consent_confirmed:false}:{})})});
    if(!saved?.length)throw Error('GALLERY_CHANGED');
   }else{
    const payload:any=site?{key:'rental_hero',storage_path:path}:parent?{[parent]:id,storage_path:path}:{id:recordId,storage_path:path,publication_status:'draft',consent_confirmed:false};
    if(parent){const images=await request('/rest/v1/'+imageTable+'?'+parent+'=eq.'+id+'&select=id,sort_order&order=sort_order.desc&limit=1');payload.is_cover=images.length===0;payload.sort_order=images.length?Number(images[0].sort_order||0)+1:0;}
    saved=await request('/rest/v1/'+imageTable,{method:'POST',body:JSON.stringify(payload)});
    if(!saved?.length)throw Error('ACCESS_DENIED');
   }
  }catch(error){
   try{await discardUpload(env,path);}catch{console.error('Failed upload compensation queued unavailable');}
   throw error;
  }
  return reply({success:true,record:saved[0],...await drainMediaCleanup(env)});
 }catch(error){
  if(error instanceof Error&&error.message==='GALLERY_CHANGED')return reply({error:'Galeri berubah. Muat ulang foto, lalu coba lagi.'},409);
  if(error instanceof Error&&error.message==='PHOTO_NOT_FOUND')return reply({error:'Foto tidak ditemukan. Muat ulang galeri.'},404);
  if(error instanceof Error&&error.message==='ACCESS_DENIED')return reply({error:'Akses atau sesi sudah tidak aktif. Masuk ulang.'},403);
  if(error instanceof Error&&error.message==='BODY_TOO_LARGE')return reply({error:'Permintaan terlalu besar.'},413);
  if(error instanceof SyntaxError||error instanceof TypeError)return reply({error:'Isian tidak valid.'},400);
  console.error('admin-media operation failed');return reply({error:'Foto belum berhasil diproses. Coba lagi atau periksa koneksi.'},500);
 }
}
