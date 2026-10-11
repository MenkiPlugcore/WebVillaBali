import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';import {loadGallery} from '../gallery.js';
const photos=[{id:'one',url:'https://example.invalid/one.jpg',is_cover:true},{id:'two',url:'https://example.invalid/two.jpg',is_cover:false}];
function dom(){const {document}=parseHTML('<main><div id="gallery"></div></main>');globalThis.document=document;globalThis.confirm=()=>true;return document.querySelector('#gallery');}
test('gallery buttons set cover, persist full order and retain old state after failure',async()=>{
 const container=dom(),calls=[];let records=photos.map(x=>({...x})),fail=false;
 const request=async body=>{calls.push(body);if(body.action==='list')return {images:records};if(fail)throw Error('Network unavailable');if(body.action==='cover')records=records.map(x=>({...x,is_cover:x.id===body.image_id}));if(body.action==='reorder')records=body.order.map(id=>records.find(x=>x.id===id));return {success:true};};
 await loadGallery(container,{table:'properties',id:'parent',request,onNotice(){}});assert.equal(container.querySelector('[data-cover=one]').disabled,true);assert.equal(container.querySelector('[data-move="0"][data-direction="-1"]').disabled,true);
 await container.querySelector('[data-cover=two]').onclick();assert.equal(container.querySelector('[data-cover=two]').disabled,true);
 await container.querySelector('[data-move="1"][data-direction="-1"]').onclick();assert.deepEqual(calls.find(x=>x.action==='reorder').order,['two','one']);
 fail=true;await container.querySelector('[data-cover=one]').onclick();assert.match(container.querySelector('[role=alert]').textContent,/Network/);assert.equal(container.querySelector('[data-cover=two]').disabled,true);assert.equal(container.querySelector('[data-cover=one]').disabled,false);
});
test('late gallery response cannot repaint after section navigation',async()=>{const container=dom();let resolve,current=true;const loaded=loadGallery(container,{table:'properties',id:'p',request:()=>new Promise(r=>resolve=r),onNotice(){},isCurrent:()=>current});current=false;container.textContent='Different section';resolve({images:photos});await loaded;assert.equal(container.textContent,'Different section');});
