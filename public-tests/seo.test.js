import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { handle } from '../worker.js';
import { SITE, pages } from '../seo/config.js';
import { metadata, propertyPage } from '../seo/render.js';

const template = readFileSync(new URL('../property.html',import.meta.url),'utf8');
const fixture = { slug:'ubud-home',title_en:'Ubud Garden Home',title_id:'Rumah Ubud',description_en:'A quiet home in Ubud for a longer stay.',property_type:'house',purpose:'rent',price:2000000,currency:'IDR',bedrooms:2,bathrooms:1,locations:{name:'Ubud'},property_images:[{id:'10000000-0000-4000-8000-000000000001'}] };
const env = { ASSETS:{ fetch:async()=>new Response(template,{headers:{'Content-Type':'text/html'}}) } };
const json = (data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const request = (path,method='GET')=>new Request(SITE.origin+path,{method});

test('published property HTML includes its content and metadata before JavaScript runs',async()=>{
 const seen=[];
 const response=await handle(request('/property?slug=ubud-home&utm_source=test'),env,async(url,options)=>{seen.push({url,options});return json({properties:[fixture]});});
 assert.equal(response.status,200);
 const html=await response.text(),{document}=parseHTML(html);
 assert.equal(document.querySelector('h1').textContent,fixture.title_en);
 assert.match(document.querySelector('#liveProperty').textContent,/quiet home/);
 assert.equal(document.querySelector('#liveProperty').getAttribute('aria-busy'),'false');
 assert.equal(document.querySelector('link[rel=canonical]').getAttribute('href'),SITE.origin+'/property?slug=ubud-home');
 assert.match(document.querySelector('meta[name=robots]').content,/^index,/);
 const structured=JSON.parse(document.querySelector('#siteStructuredData').textContent);
 assert.equal(structured['@type'],'RealEstateListing');assert.equal(structured.name,fixture.title_en);
 assert.equal(structured.aggregateRating,undefined);
 assert.equal(seen.length,1);assert.equal(new URL(seen[0].url).searchParams.get('slug'),fixture.slug);
 assert.equal(seen[0].options.headers.Authorization,undefined);
 assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self';/);
 assert.equal(response.headers.get('X-Frame-Options'),'DENY');
});

test('HTML and JSON-LD escape untrusted property text without executable markup',async()=>{
 const row={...fixture,title_en:'Home </script><script>alert(1)</script> & "Bali"',description_en:'<img src=x onerror=alert(2)> A home.'};
 const response=await handle(request('/property?slug=ubud-home'),env,async()=>json({properties:[row]}));
 const html=await response.text(),{document}=parseHTML(html);
 assert.equal(document.querySelector('h1').textContent,row.title_en);
 assert.equal(document.querySelector('#liveProperty script'),null);
 assert.equal(document.querySelector('#liveProperty [onerror]'),null);
 assert.equal(JSON.parse(document.querySelector('#siteStructuredData').textContent).name,row.title_en);
 assert.equal(document.querySelector('meta[property="og:title"]').getAttribute('content'),row.title_en+' | '+SITE.name);
});

test('missing, invalid and withdrawn properties return an actual noindex 404',async()=>{
 for(const path of ['/property','/property?slug=','/property?slug=../admin','/property?slug=ok&slug=other']){
  const response=await handle(request(path),env,async()=>{throw Error('Invalid slug must not fetch');});
  assert.equal(response.status,404);assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
 }
 for(const fetcher of [async()=>json({properties:[]}),async()=>json({error:'not found'},404)])assert.equal((await handle(request('/property?slug=withdrawn'),env,fetcher)).status,404);
});

test('upstream failures remain retryable 503 responses, rather than false missing listings',async()=>{
 for(const fetcher of [async()=>{throw Error('offline');},async()=>json({},503),async()=>json({unexpected:[]}),async()=>json({properties:[{...fixture,slug:'wrong'}]})]){
  const response=await handle(request('/property?slug=ubud-home'),env,fetcher);
  assert.equal(response.status,503);assert.equal(response.headers.get('Retry-After'),'60');assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
 }
});

test('sitemap follows public catalogue pagination, escapes URLs and excludes private or personalised pages',async()=>{
 const seen=[];
 const response=await handle(request('/sitemap.xml'),env,async url=>{const page=new URL(url).searchParams.get('page');seen.push(page);return json(page==='0'?{properties:[fixture,fixture],hasMore:true}:{properties:[{...fixture,slug:'bali-villa'},{slug:'../private'}],hasMore:false});});
 const xml=await response.text();assert.equal(response.status,200);assert.match(response.headers.get('Content-Type'),/application\/xml/);
 assert.deepEqual(seen,['0','1']);assert.equal(xml.split('slug=ubud-home').length-1,1);
 for(const path of ['/privacy','/terms','/cancellation','/motor-rental','slug=bali-villa'])assert.ok(xml.includes(path));
 for(const path of ['/admin','/dev','/saved','/compare','/guest-moments','../private'])assert.ok(!xml.includes(path));
});

test('an incomplete sitemap fails instead of silently publishing a partial catalogue',async()=>{
 const response=await handle(request('/sitemap.xml'),env,async()=>json({properties:[fixture],hasMore:true}));
 assert.equal(response.status,503);assert.equal(response.headers.get('Retry-After'),'60');
});

test('canonical redirects, HEAD requests and unrelated asset routes retain their intended behaviour',async()=>{
 for(const path of ['/properties/ubud-home.html','/properties/ubud-home/','/property.html?slug=ubud-home','/property/?slug=ubud-home']){
  const response=await handle(request(path),env,async()=>json({properties:[fixture]}));
  assert.equal(response.status,301);assert.equal(response.headers.get('Location'),SITE.origin+'/property?slug=ubud-home');
 }
 const head=await handle(request('/property?slug=ubud-home','HEAD'),env,async()=>json({properties:[fixture]}));assert.equal(head.status,200);assert.equal(await head.text(),'');
 assert.equal((await handle(request('/property?slug=ubud-home','POST'),env)).status,405);
 const asset=await handle(request('/admin/'),{ASSETS:{fetch:async req=>new Response(new URL(req.url).pathname)}});assert.equal(await asset.text(),'/admin/');
});

test('static pages have one canonical and data-only structured metadata with truthful public content',()=>{
 for(const page of pages){
  const html=readFileSync(new URL('../'+page.file,import.meta.url),'utf8'),{document}=parseHTML(html);
  assert.equal(document.querySelectorAll('link[rel=canonical]').length,1,page.file);
  assert.equal(document.querySelector('link[rel=canonical]').getAttribute('href'),SITE.origin+page.path);
  assert.equal(document.querySelectorAll('meta[name=description]').length,1);
  assert.equal(document.querySelectorAll('#siteStructuredData').length,1);
  assert.doesNotThrow(()=>JSON.parse(document.querySelector('#siteStructuredData').textContent));
  assert.ok(document.querySelector('[data-policy-links]'),page.file);
  assert.equal(document.querySelector('meta[name=robots]').content.startsWith('index,'),page.index);
  assert.doesNotMatch(document.body.textContent,/Concept preview|Sample client stories|no personal data is transmitted|Sample rates only/);
 }
 const home=parseHTML(readFileSync(new URL('../index.html',import.meta.url),'utf8')).document;
 assert.equal(home.querySelectorAll('#reviews .review-stars').length,0);
 assert.equal(home.querySelectorAll('#reviews .review-card').length,3);
});

test('metadata generation is idempotent and never promotes a generic property shell for indexing',()=>{
 const page=pages.find(page=>page.file==='property.html');
 const once=metadata(template,page);assert.equal(metadata(once,page),once);
 assert.equal(propertyPage(fixture).index,true);assert.equal(page.index,false);
});

test('public robots allow rendering while staff pages keep noindex protections',()=>{
 const robots=readFileSync(new URL('../robots.txt',import.meta.url),'utf8'),headers=readFileSync(new URL('../_headers',import.meta.url),'utf8');
 assert.match(robots,/Allow: \/\n/);assert.doesNotMatch(robots,/Disallow: \/\s*\n/);
 assert.ok(robots.includes('Sitemap: '+SITE.origin+'/sitemap.xml'));
 assert.match(headers,/\/admin\/\*[\s\S]*?X-Robots-Tag: noindex, nofollow/);
 assert.match(headers,/\/dev\/\*[\s\S]*?X-Robots-Tag: noindex, nofollow/);
});
