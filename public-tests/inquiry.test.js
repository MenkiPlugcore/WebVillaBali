import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {webcrypto} from 'node:crypto';import {parseHTML} from 'linkedom';import {handle,validate} from '../supabase/functions/public-inquiry/index.js';import {handle as catalog} from '../supabase/functions/public-catalog/index.js';
const id='74f847f1-f32d-450c-a64a-7af7d7368201',env={url:'https://example.supabase.co',anon:'anon',key:'server-secret'};
const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const data=()=>({request_id:id,started_at:Date.now()-5000,name:'Test customer',email:'customer@example.invalid',message:'Please send details',language:'id',inquiry_type:'general'});
const request=(body,extra={})=>new Request('https://example.supabase.co/functions/v1/public-inquiry',{method:'POST',headers:{origin:'https://webvillabali.menkiestes.workers.dev','Content-Type':'application/json',...extra},body:JSON.stringify(body)});
async function mock(fn,run){const old=globalThis.fetch;globalThis.fetch=fn;try{return await run();}finally{globalThis.fetch=old;}}
test('inquiry validates contact, message, honeypot and size before database calls',async()=>{
 await mock(()=>{throw Error('must not fetch');},async()=>{
 for(const body of [{...data(),email:'bad'},{...data(),email:'',phone:'123'},{...data(),message:''},{...data(),website:'bot'},{...data(),started_at:Date.now()},{...data(),name:'x'.repeat(151)}])assert.equal((await handle(request(body),env)).status,400);
 assert.equal((await handle(request({...data(),message:'x'.repeat(20000)}),env)).status,413);
 assert.equal((await handle(request(data(),{origin:'https://evil.example'}),env)).status,403);
 });
});
test('inquiry accepts only whitelisted fields and HMACs contact before server-only RPC',async()=>{
 let payload;await mock(async(url,init)=>{assert.match(url,/rpc\/submit_inquiry$/);assert.equal(init.headers.Authorization,'Bearer server-secret');payload=JSON.parse(init.body);return json({status:200,ticket_no:'AUP-100001'});},async()=>{
 const response=await handle(request({...data(),status:'closed',internal_notes:'forged',id:'forged',role:'owner'}),env);assert.equal(response.status,200);assert.deepEqual(await response.json(),{success:true,ticket_no:'AUP-100001'});assert.match(payload.p_contact_hash,/^[a-f0-9]{64}$/);assert.equal(payload.p_data.status,undefined);assert.equal(payload.p_data.internal_notes,undefined);assert.equal(payload.p_data.inquiry_type,'general');
 });
});
test('rental quote is calculated on server from published rates, never client amounts',async()=>{
 let saved;await mock(async(url,init)=>{if(url.includes('/motorbikes?')){assert.equal(init.headers.Authorization,'Bearer anon');assert.equal(new URL(url).searchParams.get('publication_status'),'eq.published');return json([{name:'Motor verified',daily_price:100000,monthly_price:1800000,currency:'IDR',availability:'available'}]);}saved=JSON.parse(init.body);return json({status:200,ticket_no:'AUP-100001'});},async()=>{
 const body={...data(),inquiry_type:'motorbike',motorbike_id:id,plan:'daily',duration:3,start:'2030-01-01',area:'Ubud',estimate:1};assert.equal((await handle(request(body),env)).status,200);assert.match(saved.p_data.message,/300\.000/);assert.match(saved.p_data.message,/Motor verified/);assert.equal(saved.p_data.motorbike_id,id);
 });
});
test('unpublished property and unavailable motorbike cannot receive inquiries',async()=>{
 await mock(async()=>json([]),async()=>{assert.equal((await handle(request({...data(),inquiry_type:'property',property_id:id}),env)).status,404);});
 await mock(async()=>json([{availability:'unavailable'}]),async()=>{assert.equal((await handle(request({...data(),inquiry_type:'motorbike',motorbike_id:id,plan:'daily',duration:1,start:'2030-01-01'}),env)).status,404);});
});
test('rate limits and RPC failures produce honest failures with no success response',async()=>{
 for(const status of [429,409])await mock(async()=>json({status}),async()=>{const response=await handle(request(data()),env);assert.equal(response.status,status);if(status===429)assert.equal(response.headers.get('retry-after'),'600');});
 await mock(async()=>new Response('',{status:500}),async()=>{assert.equal((await handle(request(data()),env)).status,503);});
});
test('rental validation rejects impossible dates, excessive or fractional duration',()=>{
 for(const update of [{start:'2030-02-30'},{start:'2020-01-01'},{duration:1.5},{duration:366},{plan:'monthly',duration:25}])assert.throws(()=>validate({...data(),inquiry_type:'motorbike',motorbike_id:id,plan:'daily',duration:1,start:'2030-01-01',...update}));
});
test('public motorbike catalog and images use anonymous published checks and private bucket',async()=>{
 const calls=[];await mock(async(url,init)=>{calls.push(url);if(url.includes('/motorbike_images?'))return json([{storage_path:'motorbikes/'+id+'/'+id+'.jpg',motorbike_id:id}]);if(url.includes('/motorbikes?'))return json([{id,name:'Live motorbike',motorbike_images:[]}]);assert.equal(init.headers.Authorization,'Bearer server-secret');return json({signedURL:'/object/sign/aup-media/motorbikes/photo.jpg?token=abc'});},async()=>{
 const response=await catalog(new Request('https://example.supabase.co/functions/v1/public-catalog?kind=motorbike'),env);assert.ok((await response.json()).motorbikes);assert.equal((await catalog(new Request('https://example.supabase.co/functions/v1/public-catalog?kind=motorbike&image='+id),env)).status,302);assert.ok(calls.some(url=>url.includes('/object/sign/aup-media/motorbikes/')));
 });
});
test('form retains data on failure, retries with the same request id and resets only after success',async()=>{
 const {window,document}=parseHTML('<html><body><form id="f"><input name="name" value="Test"><input name="email" value="test@example.invalid"><textarea name="message">Hello</textarea><button type="submit">Send</button></form></body></html>');const form=document.getElementById('f');form.reset=()=>form.querySelectorAll('input,textarea').forEach(el=>el.value='');
 class FD{constructor(f){this.values=new Map(Array.from(f.querySelectorAll('[name]')).map(el=>[el.getAttribute('name'),el.value]));}get(name){return this.values.get(name)||'';}}
 let clock=Date.now(),attempts=[];const fakeWindow={};const context=vm.createContext({window:fakeWindow,document,localStorage:{getItem:()=> 'id'},FormData:FD,Date:{now:()=>clock},crypto:webcrypto,AbortSignal,fetch:async(url,init)=>{attempts.push(JSON.parse(init.body));if(attempts.length===1)throw Error('offline');return json({success:true,ticket_no:'AUP-100001'});}});
 vm.runInContext(fs.readFileSync('inquiry.js','utf8'),context);fakeWindow.AUPInquiry.bind(form);clock+=2000;
 const submit=async()=>{form.dispatchEvent(new window.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,15));};await submit();assert.equal(form.querySelector('[name=name]').value,'Test');assert.match(form.querySelector('.inquiry-status').textContent,/belum terkirim/);await submit();assert.equal(attempts[0].request_id,attempts[1].request_id);assert.equal(form.querySelector('[name=name]').value,'');assert.match(form.querySelector('.inquiry-status').textContent,/AUP-100001/);
});
test('service inquiries verify published service and use server title, ignoring forged references',async()=>{let payload;await mock(async(url,init)=>{if(url.includes('/services?')){assert.equal(init.headers.Authorization,'Bearer anon');assert.equal(new URL(url).searchParams.get('publication_status'),'eq.published');return json([{title_id:'Layanan asli',title_en:'Real service'}]);}payload=JSON.parse(init.body);return json({status:200,ticket_no:'AUP-100009'});},async()=>{const response=await handle(request({...data(),inquiry_type:'service',service_id:id,service_title:'FORGED'}),env);assert.equal(response.status,200);assert.equal(payload.p_data.service_id,id);assert.match(payload.p_data.message,/Layanan asli/);assert.doesNotMatch(payload.p_data.message,/FORGED/);});await mock(async()=>json([]),async()=>{assert.equal((await handle(request({...data(),inquiry_type:'service',service_id:id}),env)).status,404);});assert.throws(()=>validate({...data(),inquiry_type:'service',service_id:'bad'}));});
