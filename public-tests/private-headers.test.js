import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {handle} from '../worker.js';

test('panel, activation and checkout paths force private headers even when asset defaults disagree',async()=>{
 for(const path of ['/admin','/admin/','/admin/index.html','/admin/activate','/admin/activate/','/admin/app.bundle.js','/dev','/dev/','/dev/index.html','/pay','/pay/','/pay.html']){
  for(const status of [200,301,404]){
   const r=await handle(new Request('https://site.test'+path),{ASSETS:{fetch:async()=>new Response('asset',{status,headers:{'Content-Security-Policy':"style-src 'unsafe-inline'",'Referrer-Policy':'same-origin','Cache-Control':'public,max-age=3600',Location:'/admin/'}})}});
   assert.equal(r.status,status,path);assert.equal(r.headers.get('Location'),'/admin/',path);
   assert.equal(r.headers.get('Cache-Control'),'no-store',path);assert.equal(r.headers.get('Referrer-Policy'),'no-referrer',path);
   assert.equal(r.headers.get('X-Robots-Tag'),'noindex, nofollow',path);assert.equal(r.headers.get('X-Frame-Options'),'DENY',path);
   assert.match(r.headers.get('Content-Security-Policy'),/style-src 'self';/);assert.doesNotMatch(r.headers.get('Content-Security-Policy'),/unsafe-inline|unsafe-eval/);
   assert.equal(await r.text(),'asset');
  }
 }
 const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
 for(const path of ['/admin','/admin/*','/dev','/dev/*'])assert.ok(config.assets.run_worker_first.includes(path),path);
});
test('private HEAD responses keep security headers and do not return a body',async()=>{
 const r=await handle(new Request('https://site.test/admin/',{method:'HEAD'}),{ASSETS:{fetch:async()=>new Response('private')}});
 assert.equal(await r.text(),'');assert.equal(r.headers.get('Cache-Control'),'no-store');
});
