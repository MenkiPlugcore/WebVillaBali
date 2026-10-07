import {imageType,staffRole,validUUID,mediaTables} from './validation.js';
const bucket='aup-media';
const allowedOrigins=['https://webvillabali.menkiestes.workers.dev','https://agungubudproperty.com','https://www.agungubudproperty.com'];
export async function handle(req:Request,env:{url:string,key:string}){
 const origin=req.headers.get('origin');const headers={'Access-Control-Allow-Origin':origin&&allowedOrigins.includes(origin)?origin:allowedOrigins[0],'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json'}});
 if(origin&&!allowedOrigins.includes(origin))return reply({error:'Origin ditolak.'},403);
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Metode tidak tersedia.'},405);
 const token=req.headers.get('authorization');if(!token?.startsWith('Bearer '))return reply({error:'Silakan login.'},401);
 const serverHeaders={apikey:env.key,Authorization:'Bearer '+env.key};
 const userResponse=await fetch(env.url+'/auth/v1/user',{headers:{apikey:env.key,Authorization:token}});
 if(!userResponse.ok)return reply({error:'Sesi tidak valid. Masuk ulang.'},401);
 const user=await userResponse.json();if(!staffRole(user))return reply({error:'Akses pengelola diperlukan.'},403);
 const callerHeaders={apikey:env.key,Authorization:token,'Content-Type':'application/json',Prefer:'return=representation'};
 async function request(path:string,init:RequestInit={},server=false){const response=await fetch(env.url+path,{...init,headers:{...(server?serverHeaders:callerHeaders),...init.headers}});if(!response.ok)throw Error('Operasi gagal ('+response.status+').');if(response.status===204)return null;return response.json();}
 try{
 if(Number(req.headers.get('content-length')||0)>9*1024*1024)return reply({error:'Maksimal 8 MB per foto.'},413);
 const multipart=req.headers.get('content-type')?.startsWith('multipart/form-data');const body=multipart?await req.formData():await req.json();const get=(key:string)=>multipart?body.get(key):body[key];
 const table=get('table'),id=get('id'),action=multipart?'upload':get('action');if(!Object.hasOwn(mediaTables,table))return reply({error:'Jenis konten tidak valid.'},400);
 if(!(table==='guest_moments'&&action==='upload')&&!validUUID(id))return reply({error:'ID konten tidak valid.'},400);
 const [imageTable,parent]=mediaTables[table as keyof typeof mediaTables];
 let record;if(id){const records=await request('/rest/v1/'+table+'?id=eq.'+id+'&select=id,storage_path'.replace(',storage_path',table==='guest_moments'?',storage_path':''));record=records[0];if(!record)return reply({error:'Konten tidak ditemukan.'},404);}
 if(action==='list'){
 const images=table==='guest_moments'?[record]:await request('/rest/v1/'+imageTable+'?'+parent+'=eq.'+id+'&select=id,storage_path,is_cover&order=sort_order.asc,created_at.asc');
 const signed=await Promise.all(images.map(async(image:any)=>{const signed=await request('/storage/v1/object/sign/'+bucket+'/'+image.storage_path,{method:'POST',body:JSON.stringify({expiresIn:300}),headers:{'Content-Type':'application/json'}},true);return {...image,url:env.url+'/storage/v1'+(signed.signedURL||signed.signedUrl)};}));return reply({images:signed});
 }
 if(action==='remove'){
 if(table==='guest_moments')return reply({error:'Arsipkan momen untuk menyembunyikan foto tamu.'},400);
 if(!validUUID(get('image_id')))return reply({error:'ID foto tidak valid.'},400);
 const images=await request('/rest/v1/'+imageTable+'?id=eq.'+get('image_id')+'&'+parent+'=eq.'+id+'&select=id,storage_path');if(!images[0])return reply({error:'Foto tidak ditemukan.'},404);
 await request('/rest/v1/'+imageTable+'?id=eq.'+images[0].id,{method:'DELETE'});
 await request('/storage/v1/object/'+bucket,{method:'DELETE',body:JSON.stringify({prefixes:[images[0].storage_path]}),headers:{'Content-Type':'application/json'}},true);return reply({success:true});
 }
 if(action!=='upload')return reply({error:'Aksi tidak valid.'},400);
 if(table==='guest_moments'&&id)return reply({error:'Tambahkan momen baru untuk foto berbeda.'},400);
 const file=get('file');if(!(file instanceof File)||!file.size||file.size>8*1024*1024)return reply({error:'Pilih foto hingga 8 MB.'},400);
 const bytes=new Uint8Array(await file.arrayBuffer());const kind=imageType(bytes);if(!kind||kind[0]!==file.type)return reply({error:'Gunakan foto JPG, PNG, atau WebP yang valid.'},400);
 // Provision only this private bucket through the supported Storage API.
 const existing=await fetch(env.url+'/storage/v1/bucket/'+bucket,{headers:serverHeaders});
 if(existing.status===404||existing.status===400){const created=await fetch(env.url+'/storage/v1/bucket',{method:'POST',headers:{...serverHeaders,'Content-Type':'application/json'},body:JSON.stringify({id:bucket,name:bucket,public:false,file_size_limit:8*1024*1024,allowed_mime_types:['image/jpeg','image/png','image/webp']})});if(!created.ok&&created.status!==409)throw Error('Penyimpanan foto belum tersedia.');}
 else if(!existing.ok)throw Error('Penyimpanan foto belum tersedia.');
 else if((await existing.json()).public)throw Error('Bucket harus privat.');
 const path=table+'/'+(id||crypto.randomUUID())+'/'+crypto.randomUUID()+'.'+kind[1];
 const upload=await fetch(env.url+'/storage/v1/object/'+bucket+'/'+path,{method:'POST',headers:{...serverHeaders,'Content-Type':kind[0],'x-upsert':'false'},body:bytes});if(!upload.ok)throw Error('Upload foto gagal.');
 let saved;try{const payload:any=parent?{[parent]:id,storage_path:path}: {storage_path:path,publication_status:'draft',consent_confirmed:false};if(parent){const images=await request('/rest/v1/'+imageTable+'?'+parent+'=eq.'+id+'&select=id&limit=1');payload.is_cover=images.length===0;}
 saved=await request('/rest/v1/'+imageTable,{method:'POST',body:JSON.stringify(payload)});
 }catch(error){await fetch(env.url+'/storage/v1/object/'+bucket,{method:'DELETE',headers:{...serverHeaders,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})});throw error;}
 return reply({success:true,record:saved[0]});
 }catch(error){console.error('admin-media operation failed',error instanceof Error?error.message:'unknown');return reply({error:'Foto belum berhasil diproses. Coba lagi atau periksa koneksi.'},500);}
}
Deno.serve((req:Request)=>handle(req,{url:Deno.env.get('SUPABASE_URL')!,key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}));
