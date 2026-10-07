import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {handle} from '../supabase/functions/public-catalog/index.js';
const parent='01234567-0123-4123-8123-012345678901', photo='01234567-0123-4123-8123-012345678902';
const env={url:'https://example.supabase.co',anon:'anon-key',key:'server-secret'};
function request(query='',init={}){return new Request('https://example.supabase.co/functions/v1/public-catalog'+query,init);}
async function mock(fn,run){const old=globalThis.fetch;globalThis.fetch=fn;try{return await run();}finally{globalThis.fetch=old;}}
const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
test('public catalog ignores staff JWT and never returns drafts or secret paths',async()=>{
 const calls=[];
 await mock(async(url,init)=>{calls.push({url,init});return json([{slug:'real-listing',property_images:[{id:photo,is_cover:false,sort_order:1},{id:parent,is_cover:true,sort_order:9}]}]);},async()=>{
 const res=await handle(request('',{headers:{Authorization:'Bearer staff-jwt'}}),env),data=await res.json();assert.equal(res.status,200);assert.equal(data.properties[0].property_images[0].id,parent);assert.equal(calls[0].init.headers.Authorization,'Bearer anon-key');const query=new URL(calls[0].url).searchParams;assert.equal(query.get('publication_status'),'eq.published');assert.ok(!query.get('select').includes('storage_path'));assert.equal(res.headers.get('cache-control'),'no-store');});
});
test('public catalog is read-only and validates paging and slugs',async()=>{
 await mock(()=>{throw Error('must not fetch');},async()=>{
 assert.equal((await handle(request('',{method:'POST'}),env)).status,405);
 assert.equal((await handle(request('?slug=bad%2Fpath'),env)).status,404);
 assert.equal((await handle(request('?page=-1'),env)).status,400);
 assert.equal((await handle(request('',{headers:{origin:'https://evil.example'}}),env)).status,403);
 });
});
test('draft image or missing parent is never signed',async()=>{
 for(const rows of [[],[{storage_path:'properties/'+parent+'/'+photo+'.jpg',property_id:parent}]]){
 let calls=0;await mock(async(url,init)=>{calls++;assert.ok(!url.includes('/storage/'));assert.equal(init.headers.Authorization,'Bearer anon-key');return json(calls===1?rows:[]);},async()=>{assert.equal((await handle(request('?image='+photo),env)).status,404);});
 }
});
test('only a published database-owned image path receives a short-lived signed redirect',async()=>{
 const calls=[];await mock(async(url,init)=>{calls.push({url,init});if(url.includes('/property_images?'))return json([{storage_path:'properties/'+parent+'/'+photo+'.jpg',property_id:parent}]);if(url.includes('/properties?'))return json([{id:parent}]);assert.equal(init.headers.Authorization,'Bearer server-secret');assert.equal(JSON.parse(init.body).expiresIn,300);return json({signedURL:'/object/sign/aup-media/properties/photo.jpg?token=server-signed'});},async()=>{const res=await handle(request('?image='+photo+'&path=private-secret.jpg'),env);assert.equal(res.status,302);assert.match(res.headers.get('location'),/^https:\/\/example.supabase.co\/storage\/v1\/object\/sign\/aup-media\//);assert.ok(calls[2].url.endsWith(photo+'.jpg'));assert.equal(new URL(calls[1].url).searchParams.get('publication_status'),'eq.published');});
});
function browser(html,fetcher){
 const parsed=parseHTML(html),document=parsed.document,window={document,matchMedia:()=>({matches:true}),addEventListener(){},requestAnimationFrame:fn=>fn()},storage=new Map([['aup-language','id']]);const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 const context=vm.createContext({window,document,localStorage,location:{href:'https://webvillabali.menkiestes.workers.dev/index.html',pathname:'/index.html'},fetch:fetcher,AbortSignal,URL,URLSearchParams,CustomEvent:parsed.window.CustomEvent,Image:class{set src(value){this.onload?.();}},setTimeout,clearTimeout,console,Intl});
 window.matchMedia=()=>({matches:true});window.addEventListener=()=>{};window.requestAnimationFrame=fn=>fn();
 vm.runInContext(fs.readFileSync('public-catalog.js','utf8'),context);context.AUPCatalog=window.AUPCatalog;return {window,document,context,storage};
}
const fixture={id:parent,slug:'new-property',title_id:'<img src=x onerror=alert(1)>',title_en:'New Property',property_type:'kost',purpose:'rent',price:3500000,currency:'IDR',price_period:'month',bedrooms:1,bathrooms:1,building_area_m2:24,locations:{name:'Ubud " onclick="alert(1)'},property_images:[{id:photo}],facilities:['<script>alert(1)</script>'],availability:'available'};
const settle=()=>new Promise(resolve=>setTimeout(resolve,25));
test('catalog loads multiple pages without replacing its array and formats native prices',async()=>{
 let calls=0;const b=browser('<body></body>',async()=>json({properties:[fixture],hasMore:calls++===0}));const original=b.window.AUPCatalog.items;await b.window.AUPCatalog.load();assert.equal(original,b.window.AUPCatalog.items);assert.equal(original.length,2);assert.match(b.window.AUPCatalog.money(original[0]),/3\.500\.000/);assert.equal(b.window.AUPCatalog.suffix(original[0]),'/ bulan');assert.equal(b.window.AUPCatalog.href('new-property'),'/property?slug=new-property');assert.equal(b.window.AUPCatalog.slugFromURL('/property?slug=new-property'),'new-property');
});
test('homepage renders published data safely and has a real detail link',async()=>{
 const b=browser(fs.readFileSync('index.html','utf8'),async()=>json({properties:[fixture],hasMore:false}));vm.runInContext(fs.readFileSync('script.js','utf8'),b.context);await settle();assert.equal(b.document.querySelectorAll('.property-card').length,1);assert.equal(b.document.querySelector('.property-card h3').textContent,fixture.title_id);assert.equal(b.document.querySelector('.property-card h3 img'),null);assert.equal(b.document.querySelector('.property-image').getAttribute('href'),'/property?slug=new-property');assert.equal(b.document.querySelectorAll('#locationFilter option').length,2);assert.match(b.document.querySelector('.property-price').textContent,/3\.500\.000/);
 vm.runInContext(fs.readFileSync('catalog-expansion.js','utf8'),b.context);assert.equal(b.document.querySelectorAll('.stay-card').length,1);assert.equal(b.document.querySelector('.stay-card h4 img'),null);
});
test('empty and failed loads do not reintroduce sample inventory',async()=>{
 for(const failed of [false,true]){const b=browser(fs.readFileSync('index.html','utf8'),async()=>{if(failed)throw Error('offline');return json({properties:[],hasMore:false});});vm.runInContext(fs.readFileSync('script.js','utf8'),b.context);await settle();assert.equal(b.document.querySelectorAll('.property-card').length,0);assert.equal(b.document.querySelector('#emptyState').hidden,false);assert.match(b.document.querySelector('#emptyState h3').textContent,failed?/belum bisa dimuat/:/segera hadir/);assert.equal(b.document.querySelectorAll('#emptyState button').length,failed?1:0);}
});
test('detail renders safe fields, gallery and language changes; no demo form',async()=>{
 const b=browser(fs.readFileSync('property.html','utf8'),async()=>json({properties:[{...fixture,property_images:[{id:photo},{id:parent}]}],hasMore:false}));b.context.location.href='https://webvillabali.menkiestes.workers.dev/property?slug=new-property';b.context.location.pathname='/property';vm.runInContext(fs.readFileSync('property-detail.js','utf8'),b.context);await settle();assert.equal(b.document.querySelector('h1').textContent,fixture.title_id);assert.equal(b.document.querySelector('h1 img'),null);assert.equal(b.document.querySelectorAll('[data-gallery]').length,2);assert.equal(b.document.querySelector('.feature-list script'),null);assert.equal(b.document.querySelector('#inquiryForm'),null);b.document.getElementById('languageToggle').click();assert.equal(b.document.querySelector('h1').textContent,'New Property');b.document.getElementById('detailSave').click();assert.equal(JSON.parse(b.storage.get('aup-saved-properties-v1')).length,1);
});
test('saved listings refresh current published fields and omit retired snapshots',async()=>{
 const b=browser(fs.readFileSync('saved.html','utf8'),async()=>json({properties:[fixture],hasMore:false}));b.storage.set('aup-saved-properties-v1',JSON.stringify([{slug:'new-property',title:'Outdated',image:'https://bad.invalid/old'},{slug:'archived-listing',title:'Retired'}]));vm.runInContext(fs.readFileSync('saved.js','utf8'),b.context);await settle();assert.equal(b.document.querySelectorAll('.saved-card').length,1);assert.equal(b.document.querySelector('.saved-card h2').textContent,fixture.title_id);assert.equal(b.document.querySelector('.saved-card h2 img'),null);assert.equal(b.document.querySelector('.saved-card-view').getAttribute('href'),'/property?slug=new-property');
});
test('comparison supports new property slugs and kost with safe current data',async()=>{
 const b=browser(fs.readFileSync('compare.html','utf8'),async()=>json({properties:[fixture],hasMore:false}));b.context.MutationObserver=class{observe(){}};b.storage.set('aup-compare-properties-v1',JSON.stringify(['new-property','archived-listing']));vm.runInContext(fs.readFileSync('compare.js','utf8'),b.context);await settle();assert.equal(b.document.querySelectorAll('.compare-property-head').length,1);assert.equal(b.document.querySelector('.compare-head-title').textContent,fixture.title_id);assert.equal(b.document.querySelector('.compare-head-title img'),null);assert.equal(b.document.querySelector('.compare-head-actions a').getAttribute('href'),'/property?slug=new-property');assert.match(b.document.querySelector('#compareTable').textContent,/Kost/);
});

test('Cloudflare canonical URLs and old .html URLs both preserve the property slug',()=>{
 const b=browser('<body></body>',async()=>json({properties:[],hasMore:false}));
 for(const path of ['/property?slug=tesproperty','/property/?slug=tesproperty','/property.html?slug=tesproperty','/properties/tesproperty','/properties/tesproperty/','/properties/tesproperty.html'])assert.equal(b.window.AUPCatalog.slugFromURL(path),'tesproperty',path);
});
