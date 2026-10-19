import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

test('strict script policy is compatible with all public HTML',async()=>{
 const root=new URL('../../',import.meta.url);
 const paths=[...(await readdir(root)).filter(p=>p.endsWith('.html')),...(await readdir(new URL('properties/',root))).filter(p=>p.endsWith('.html')).map(p=>'properties/'+p)];
 for(const path of paths){const html=await readFile(new URL(path,root),'utf8');assert.doesNotMatch(html,/<script(?![^>]*\bsrc=)[^>]*>\s*\S/i,path);assert.doesNotMatch(html,/\son[a-z]+\s*=/i,path);}
 const headers=await readFile(new URL('_headers',root),'utf8');assert.match(headers,/script-src 'self';/);assert.match(headers,/frame-ancestors 'none'/);
});
test('deployment excludes backend, tests, credentials and admin source modules',async()=>{
 const ignore=await readFile(new URL('../../.assetsignore',import.meta.url),'utf8');
 for(const path of ['node_modules/','supabase/','backend/','admin/tests/','admin/app.js','admin/schema.js','admin/dashboard.js','admin/team.js','.env','.env.*'])assert.ok(ignore.split('\n').includes(path),path);
});
