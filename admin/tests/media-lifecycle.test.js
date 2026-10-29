import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../../supabase/functions/admin-media/handler.ts';
import {handle as scheduledCleanup} from '../../supabase/functions/media-cleanup/index.js';
import {drainMediaCleanup} from '../../supabase/functions/_shared/media-cleanup.js';
import {png} from './fixtures/images.js';
const env={url:'https://example.invalid',key:'server-only-key'};
const id='00000000-0000-4000-8000-000000000001',photo='00000000-0000-4000-8000-000000000002';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status});
function fixture({table='properties',role='owner',failPatch=false,stale=false,deleteDenied=false,failStorage=false}={}){
 const site=table==='site_media',guest=table==='guest_moments',key=site?'rental_hero':id;
 const imageTable=site||guest?table:table==='properties'?'property_images':'motorbike_images';
 const oldPath=table+'/'+key+'/'+photo+'.png',calls=[],removed=[],jobs=[];
 let path=oldPath,uploadedPath,metadataSaved=false;
 const fetch=async(url,init={})=>{
  calls.push({url,init});
  if(url.endsWith('/auth/v1/user'))return json({id,app_metadata:{aup_role:role}});
  if(url.endsWith('/rest/v1/rpc/staff_access'))return json(true);
  if(url.endsWith('/rest/v1/rpc/media_cleanup')){
   assert.equal(init.headers.Authorization,'Bearer '+env.key);
   const body=JSON.parse(init.body);
   if(body.p_action==='enqueue'){jobs.push({id:photo,lease_token:photo,storage_path:body.p_path});return json({pending:jobs.length});}
   if(body.p_action==='claim')return json(jobs.slice());
   if(body.p_action==='complete'){jobs.length=0;return json({pending:0});}
   if(body.p_action==='retry')return json({pending:jobs.length});
  }
  if(url.endsWith('/storage/v1/bucket/aup-media'))return json({public:false});
  if(url.includes('/storage/v1/object/aup-media/')){uploadedPath=url.split('/object/aup-media/')[1];return json({});}
  if(url.endsWith('/storage/v1/object/aup-media')){
   if(!failStorage)removed.push(...JSON.parse(init.body).prefixes);
   return json({},failStorage?500:200);
  }
  if(url.includes('/rest/v1/'+imageTable+'?')&&init.method==='PATCH'){
   assert.equal(init.headers.Authorization,'Bearer user-token');
   assert.equal(new URL(url).searchParams.get('storage_path'),'eq.'+oldPath);
   if(failPatch)return json({message:'db failure'},500);
   if(stale)return json([]);
   const payload=JSON.parse(init.body);metadataSaved=true;path=payload.storage_path;
   jobs.push({id:photo,lease_token:photo,storage_path:oldPath});
   return json([{id:guest?id:photo,...payload}]);
  }
  if(url.includes('/rest/v1/'+table+'?')&&init.method==='DELETE'){
   assert.equal(init.headers.Authorization,'Bearer user-token');
   if(deleteDenied)return json([]);
   metadataSaved=true;jobs.push({id:photo,lease_token:photo,storage_path:oldPath});return json([{id}]);
  }
  if(url.includes('/rest/v1/'+table+'?'))return json([{id,key:site?'rental_hero':undefined,...(site||guest?{storage_path:path}:{})}]);
  if(url.includes('/rest/v1/'+imageTable+'?'))return json([{id:photo,storage_path:path,is_cover:true,sort_order:4}]);
  throw Error('Unexpected request '+url);
 };
 const replace=(expected=oldPath)=>{
  const body=new FormData();for(const [k,v]of Object.entries({table,id:key,action:'replace',image_id:photo,expected_path:expected}))body.set(k,v);
  body.set('file',new File([png],'new.png',{type:'image/png'}));
  return new Request(env.url,{method:'POST',headers:{Authorization:'Bearer user-token'},body});
 };
 const remove=()=>new Request(env.url,{method:'POST',headers:{Authorization:'Bearer user-token','Content-Type':'application/json'},body:JSON.stringify({table,id:key,action:'delete_record'})});
 return {fetch,replace,remove,oldPath,calls,removed,jobs,get path(){return path;},get uploadedPath(){return uploadedPath;},get metadataSaved(){return metadataSaved;}};
}
test('replacement persists the new path before cleaning only the old file, preserving cover and order',async()=>{
 const original=globalThis.fetch,f=fixture();globalThis.fetch=f.fetch;
 try{
  const response=await handle(f.replace(),env);assert.equal(response.status,200);assert.equal(f.metadataSaved,true);
  assert.notEqual(f.path,f.oldPath);assert.deepEqual(f.removed,[f.oldPath]);assert.equal(f.removed.includes(f.uploadedPath),false);
  const patch=f.calls.find(c=>c.init.method==='PATCH');assert.deepEqual(Object.keys(JSON.parse(patch.init.body)),['storage_path']);
  assert.ok(f.calls.indexOf(patch)<f.calls.findIndex(c=>c.init.method==='DELETE'));
 }finally{globalThis.fetch=original;}
});
test('failed or concurrently changed replacement keeps the old file and cleans the unused new upload',async()=>{
 const original=globalThis.fetch;
 try{for(const opts of [{failPatch:true},{stale:true}]){
  const f=fixture(opts);globalThis.fetch=f.fetch;
  assert.equal((await handle(f.replace(),env)).status,opts.stale?409:500);
  assert.equal(f.path,f.oldPath);assert.deepEqual(f.removed,[f.uploadedPath]);assert.equal(f.removed.includes(f.oldPath),false);
 }}finally{globalThis.fetch=original;}
});
test('a stale displayed photo is rejected before uploading anything',async()=>{
 const original=globalThis.fetch,f=fixture();globalThis.fetch=f.fetch;
 try{assert.equal((await handle(f.replace('different-path'),env)).status,409);assert.equal(f.uploadedPath,undefined);assert.deepEqual(f.removed,[]);}finally{globalThis.fetch=original;}
});
test('replacing a guest photo revokes old consent and returns the new image to draft',async()=>{
 const original=globalThis.fetch,f=fixture({table:'guest_moments'});globalThis.fetch=f.fetch;
 try{const response=await handle(f.replace(),env);assert.equal(response.status,200);const data=await response.json();assert.equal(data.record.publication_status,'draft');assert.equal(data.record.consent_confirmed,false);assert.deepEqual(f.removed,[f.oldPath]);}finally{globalThis.fetch=original;}
});
test('owner can replace rental artwork while an editor cannot reach storage',async()=>{
 const original=globalThis.fetch;
 try{for(const role of ['owner','editor']){
  const f=fixture({table:'site_media',role});globalThis.fetch=f.fetch;
  assert.equal((await handle(f.replace(),env)).status,role==='owner'?200:403);
  assert.equal(f.metadataSaved,role==='owner');assert.equal(f.calls.some(c=>c.url.includes('/storage/')),role==='owner');
 }}finally{globalThis.fetch=original;}
});
test('deleting a product uses caller RLS and then drains its queued photos; denied deletion never touches storage',async()=>{
 const original=globalThis.fetch;
 try{for(const deleteDenied of [false,true]){
  const f=fixture({table:'motorbikes',deleteDenied});globalThis.fetch=f.fetch;
  assert.equal((await handle(f.remove(),env)).status,deleteDenied?404:200);
  assert.deepEqual(f.removed,deleteDenied?[]:[f.oldPath]);
  if(!deleteDenied)assert.ok(f.calls.findIndex(c=>c.url.includes('/rest/v1/motorbikes?')&&c.init.method==='DELETE')<f.calls.findIndex(c=>c.url.endsWith('/storage/v1/object/aup-media')));
 }}finally{globalThis.fetch=original;}
});
test('failed storage cleanup keeps a durable retry and reports the saved mutation separately',async()=>{
 const original=globalThis.fetch,f=fixture({failStorage:true});globalThis.fetch=f.fetch;
 try{const response=await handle(f.replace(),env);const data=await response.json();assert.equal(response.status,200);assert.equal(data.success,true);assert.match(data.warning,/dicoba ulang otomatis/);assert.equal(f.metadataSaved,true);assert.equal(f.jobs.length,1);assert.deepEqual(f.removed,[]);assert.ok(f.calls.some(c=>c.init.body&&String(c.init.body).includes('"p_action":"retry"')));}finally{globalThis.fetch=original;}
});
test('the scheduled worker requires its scoped token and rejects arbitrary requests before claiming jobs',async()=>{
 const original=globalThis.fetch,calls=[];
 try{
  globalThis.fetch=async(url,init)=>{calls.push(JSON.parse(init.body));return json(calls.at(-1).p_action==='verify'?false:[]);};
  for(const token of ['', 'public-key', 'a'.repeat(64)]){
   const response=await scheduledCleanup(new Request(env.url,{method:'POST',headers:{'x-cleanup-token':token}}),env);assert.equal(response.status,401);
  }
  assert.deepEqual(calls.map(c=>c.p_action),['verify']);
  globalThis.fetch=async(url,init)=>json(JSON.parse(init.body).p_action==='verify'?true:[]);
  assert.equal((await scheduledCleanup(new Request(env.url,{method:'POST',headers:{'x-cleanup-token':'a'.repeat(64)}}),env)).status,200);
 }finally{globalThis.fetch=original;}
});
test('an unsafe cleanup job cannot cause a storage deletion',async()=>{
 const original=globalThis.fetch,calls=[];
 try{globalThis.fetch=async(url)=>{calls.push(url);return json([{id,lease_token:id,storage_path:'../../auth/users'}]);};assert.match((await drainMediaCleanup(env)).warning,/dicoba ulang/);assert.equal(calls.some(url=>url.includes('/storage/')),false);}finally{globalThis.fetch=original;}
});
