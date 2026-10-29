const uuid='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const safePath=new RegExp('^((properties|motorbikes|guest_moments)/'+uuid+'|site_media/rental_hero)/'+uuid+'\\.(jpg|png|webp)$');
export async function cleanupRPC(env,body){
 const response=await fetch(env.url+'/rest/v1/rpc/media_cleanup',{method:'POST',headers:{apikey:env.key,Authorization:'Bearer '+env.key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Cleanup queue unavailable');return response.json();
}
export const cleanupWarning='Perubahan tersimpan. Pembersihan file lama sedang menunggu dan akan dicoba ulang otomatis.';
export async function drainMediaCleanup(env){
 try{
  for(let batch=0;batch<5;batch++){
   const jobs=await cleanupRPC(env,{p_action:'claim'});
   if(!Array.isArray(jobs))throw Error('Invalid cleanup batch');
   if(!jobs.length)return {};
   if(jobs.length>50||jobs.some(job=>!safePath.test(job.storage_path)))throw Error('Invalid cleanup path');
   let removed=false;
   try{
    const response=await fetch(env.url+'/storage/v1/object/aup-media',{method:'DELETE',headers:{apikey:env.key,Authorization:'Bearer '+env.key,'Content-Type':'application/json'},body:JSON.stringify({prefixes:jobs.map(job=>job.storage_path)}),signal:AbortSignal.timeout(20000)});
    removed=response.ok;
   }catch{/* The durable lease/queue also survives worker termination. */}
   const state=await cleanupRPC(env,{p_action:removed?'complete':'retry',p_jobs:jobs});
   if(!removed)return {warning:cleanupWarning};
   if(state.pending===0)return {};
  }
  return {warning:cleanupWarning};
 }catch{return {warning:cleanupWarning};}
}
export async function discardUpload(env,path){
 // Enqueue before trying Storage so failed compensation is retryable too.
 await cleanupRPC(env,{p_action:'enqueue',p_path:path});
 return drainMediaCleanup(env);
}
