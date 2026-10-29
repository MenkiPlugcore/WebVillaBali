import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {parseHTML} from 'linkedom';
import {handle} from '../supabase/functions/public-catalog/index.js';
const id='00000000-0000-4000-8000-000000000001',env={url:'https://db.example',anon:'anon-only',key:'server-only'};
test('public rental artwork is read anonymously, returns only a version, and signs only its fixed database path',async()=>{
 const old=globalThis.fetch,calls=[];
 try{
  globalThis.fetch=async(url,init)=>{calls.push({url,init});if(url.includes('/rest/v1/')){assert.equal(init.headers.Authorization,'Bearer anon-only');assert.equal(new URL(url).searchParams.get('key'),'eq.rental_hero');return new Response(JSON.stringify([{storage_path:'site_media/rental_hero/'+id+'.png',updated_at:'2026-10-29T00:00:00Z'}]));}assert.equal(init.headers.Authorization,'Bearer server-only');return new Response(JSON.stringify({signedURL:'/object/sign/aup-media/site_media/rental_hero/'+id+'.png?token=test'}));};
  const response=await handle(new Request('https://example.com?kind=site_media',{headers:{Authorization:'Bearer owner'}}),env),data=await response.json();
  assert.deepEqual(data,{media:{rental_hero:{version:'2026-10-29T00:00:00Z'}}});assert.equal(JSON.stringify(data).includes('storage_path'),false);
  const image=await handle(new Request('https://example.com?kind=site_media&image=rental_hero&path=other'),env);assert.equal(image.status,302);assert.match(image.headers.get('location'),/site_media\/rental_hero/);
  const count=calls.length;assert.equal((await handle(new Request('https://example.com?kind=site_media&image=other'),env)).status,404);assert.equal(calls.length,count);
 }finally{globalThis.fetch=old;}
});
test('missing or unsafe rental artwork uses the default and is never signed',async()=>{
 const old=globalThis.fetch;
 try{for(const rows of [[],[{storage_path:'properties/'+id+'/'+id+'.png'}],[{storage_path:'https://res.cloudinary.com/other'}]]){
  globalThis.fetch=async url=>{assert.ok(url.includes('/rest/v1/site_media'));return new Response(JSON.stringify(rows));};
  const data=await (await handle(new Request('https://example.com?kind=site_media'),env)).json();assert.equal(data.media.rental_hero,null);
  assert.equal((await handle(new Request('https://example.com?kind=site_media&image=rental_hero'),env)).status,404);
 }}finally{globalThis.fetch=old;}
});
test('custom artwork survives homepage rerenders and image failures keep the built-in fallback',async()=>{
 for(const loaded of [true,false]){
  const {window,document}=parseHTML('<html><body><div class="rental-hero-media"></div><div class="motor-teaser-media"></div></body></html>');
  vm.runInNewContext(fs.readFileSync('rental-artwork.js','utf8'),{document,Date,AbortSignal,Image:class{set src(value){this.url=value;if(loaded)this.onload();}},fetch:async()=>new Response(JSON.stringify({media:{rental_hero:{version:'2026-10-29T00:00:00Z'}}}))});
  await new Promise(r=>setTimeout(r,10));
  assert.equal(!!document.querySelector('.rental-hero-media').style.backgroundImage,loaded);
  const replacement=document.createElement('div');replacement.className='motor-teaser-media';document.querySelector('.motor-teaser-media').replaceWith(replacement);document.dispatchEvent(new window.CustomEvent('aup:mobility-rendered'));
  assert.equal(!!replacement.style.backgroundImage,loaded);
  if(loaded)assert.match(replacement.style.backgroundImage,/kind=site_media&image=rental_hero/);
 }
});
