import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {parseHTML} from 'linkedom';
import {handle} from '../supabase/functions/public-catalog/index.js';
const id='00000000-0000-4000-8000-000000000001',env={url:'https://db.example',anon:'anon-only',key:'server-only'};
test('public rental artwork is read anonymously, returns only a version, and signs only its fixed database path',async()=>{
 const old=globalThis.fetch,calls=[];
 try{
  globalThis.fetch=async(url,init)=>{calls.push({url,init});if(url.includes('/rest/v1/')){assert.equal(init.headers.Authorization,'Bearer anon-only');assert.ok(['eq.rental_hero','in.(rental_hero,tour_poster,driver_poster)'].includes(new URL(url).searchParams.get('key')));return new Response(JSON.stringify([{key:'rental_hero',storage_path:'site_media/rental_hero/'+id+'.png',updated_at:'2026-10-29T00:00:00Z'}]));}assert.equal(init.headers.Authorization,'Bearer server-only');return new Response(JSON.stringify({signedURL:'/object/sign/aup-media/site_media/rental_hero/'+id+'.png?token=test'}));};
  const response=await handle(new Request('https://example.com?kind=site_media',{headers:{Authorization:'Bearer owner'}}),env),data=await response.json();
  assert.deepEqual(data,{media:{rental_hero:{version:'2026-10-29T00:00:00Z'},tour_poster:null,driver_poster:null}});assert.equal(JSON.stringify(data).includes('storage_path'),false);
  const image=await handle(new Request('https://example.com?kind=site_media&image=rental_hero&path=other'),env);assert.equal(image.status,302);assert.match(image.headers.get('location'),/site_media\/rental_hero/);
  const count=calls.length;assert.equal((await handle(new Request('https://example.com?kind=site_media&image=other'),env)).status,404);assert.equal(calls.length,count);
 }finally{globalThis.fetch=old;}
});

test('tour and driver posters sign only their own whitelisted paths and never expose object paths in metadata',async()=>{
 const old=globalThis.fetch;
 try{for(const key of ['tour_poster','driver_poster']){
  let signed=false;
  globalThis.fetch=async(url,init)=>{
   if(url.includes('/rest/v1/site_media')){assert.equal(init.headers.Authorization,'Bearer anon-only');return new Response(JSON.stringify([{key,storage_path:'site_media/'+key+'/'+id+'.png',updated_at:'2026-11-03T00:00:00Z'}]));}
   signed=true;assert.match(url,new RegExp('/site_media/'+key+'/'));return new Response(JSON.stringify({signedURL:'/object/sign/aup-media/site_media/'+key+'/'+id+'.png?token=test'}));
  };
  const metadata=await (await handle(new Request('https://example.com?kind=site_media'),env)).json();assert.equal(metadata.media[key].version,'2026-11-03T00:00:00Z');assert.equal(JSON.stringify(metadata).includes('storage_path'),false);
  assert.equal((await handle(new Request('https://example.com?kind=site_media&image='+key),env)).status,302);assert.equal(signed,true);
  signed=false;globalThis.fetch=async url=>{assert.ok(url.includes('/rest/v1/site_media'));return new Response(JSON.stringify([{key,storage_path:'site_media/rental_hero/'+id+'.png'}]));};
  assert.equal((await handle(new Request('https://example.com?kind=site_media&image='+key),env)).status,404);assert.equal(signed,false);
 }}finally{globalThis.fetch=old;}
});

async function posters({rentalPage=false,fail=false}={}){
 const {window,document}=parseHTML(`<html><body class="${rentalPage?'motor-rental-page':''}"><button id="languageToggle"></button><button id="rentalLanguage"></button>${rentalPage?'<section id="rentalInquiry"></section>':'<section id="livingMobility"><div class="shell"><div class="lm-grid"></div></div></section>'}</body></html>`);let language='id';
 vm.runInNewContext(fs.readFileSync('rental-artwork.js','utf8'),{document,localStorage:{getItem:()=>language},Date,AbortSignal,setTimeout,fetch:async()=>{if(fail)throw Error('offline');return new Response(JSON.stringify({media:{tour_poster:{version:'2026-11-03T00:00:00Z'},driver_poster:{version:'2026-11-03T01:00:00Z'}}}));}});
 await new Promise(r=>setTimeout(r,10));return {document,window,setLanguage:value=>language=value};
}
test('posters mount in the homepage rental area and rental page, survive rerenders, and follow language changes',async()=>{
 for(const rentalPage of [false,true]){
  const {document,window,setLanguage}=await posters({rentalPage});let section=document.getElementById('rentalPosters');assert.ok(section);assert.equal(section.querySelectorAll('img').length,2);assert.match(section.querySelector('h2').textContent,/Paket tour/);
  if(rentalPage)assert.equal(section.nextElementSibling.id,'rentalInquiry');else{assert.equal(section.previousElementSibling.className,'lm-grid');section.remove();document.dispatchEvent(new window.CustomEvent('aup:mobility-rendered'));section=document.getElementById('rentalPosters');assert.ok(section);}
  assert.equal(document.querySelectorAll('#rentalPosters').length,1);const links=section.querySelectorAll('a');assert.match(links[0].getAttribute('href'),/image=tour_poster/);assert.match(links[1].getAttribute('href'),/image=driver_poster/);assert.ok(Array.from(links).every(link=>link.getAttribute('rel').includes('noopener')));
  setLanguage('en');document.getElementById(rentalPage?'rentalLanguage':'languageToggle').click();await new Promise(r=>setTimeout(r,10));assert.match(section.querySelector('h2').textContent,/Tour packages/);assert.match(section.querySelector('img').alt,/Tour/);
 }
});
test('unavailable posters show an honest retry state without invented images',async()=>{
 const {document}=await posters({fail:true});assert.equal(document.querySelectorAll('#rentalPosters img').length,0);assert.match(document.querySelector('#rentalPosters').textContent,/belum bisa dimuat/);assert.ok(document.querySelector('[data-poster-retry]'));
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
