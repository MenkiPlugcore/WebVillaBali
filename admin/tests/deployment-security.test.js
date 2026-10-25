import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {parseHTML} from 'linkedom';

test('strict script policy is compatible with all public HTML',async()=>{
 const root=new URL('../../',import.meta.url);
 const paths=[...(await readdir(root)).filter(p=>p.endsWith('.html')),...(await readdir(new URL('properties/',root))).filter(p=>p.endsWith('.html')).map(p=>'properties/'+p)];
 for(const path of paths){const html=await readFile(new URL(path,root),'utf8');const {document}=parseHTML(html);for(const script of document.querySelectorAll('script')){if(script.hasAttribute('src')){assert.equal(script.textContent.trim(),'',path);continue;}assert.equal(script.getAttribute('type'),'application/ld+json',path);assert.doesNotThrow(()=>JSON.parse(script.textContent),path);}assert.doesNotMatch(html,/\son[a-z]+\s*=/i,path);}
 const headers=await readFile(new URL('_headers',root),'utf8');assert.match(headers,/script-src 'self';/);assert.match(headers,/frame-ancestors 'none'/);
});
test('deployment excludes backend, tests, credentials and admin source modules',async()=>{
 const ignore=await readFile(new URL('../../.assetsignore',import.meta.url),'utf8');
 for(const path of ['node_modules/','supabase/','backend/','seo/','worker.js','admin/tests/','admin/app.js','admin/schema.js','admin/dashboard.js','admin/team.js','admin/staff-client.js','admin/activation.js','admin/activation-entry.js','.env','.env.*'])assert.ok(ignore.split('\n').includes(path),path);
});

test('activation entry is isolated from persistent owner sessions and uses a protected static page',async()=>{const entry=await readFile(new URL('../activation-entry.js',import.meta.url),'utf8');assert.match(entry,/persistSession:false/);assert.match(entry,/autoRefreshToken:false/);assert.match(entry,/detectSessionInUrl:false/);assert.match(entry,/replaceState/);assert.doesNotMatch(entry,/localStorage|sessionStorage/);const html=await readFile(new URL('../activate/index.html',import.meta.url),'utf8');assert.match(html,/no-referrer/);assert.doesNotMatch(html,/<script(?![^>]*\bsrc=)[^>]*>\s*\S/i);});
