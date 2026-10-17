import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {parseHTML} from 'linkedom';

function page(number='6281234567890',options={}){
 const {window,document}=parseHTML('<html><body><button id="languageToggle" type="button">ID</button><form id="contactForm"><input name="name" required><input name="email" type="email" required><textarea name="message" required></textarea><button type="submit">Buat tiket</button></form></body></html>');
 const runtime={AUP_PUBLIC_SETTINGS:{whatsapp:number},location:{href:'https://example.test/property?slug=ubud-villa#inquiry'}};
 const form=document.querySelector('form');let language='id',requests=0,validations=0;
 form.reportValidity=()=>{validations++;return true;};
 form.reset=()=>form.querySelectorAll('input,textarea').forEach(el=>el.value='');
 class FormData{constructor(f){this.form=f;}get(name){return this.form.querySelector('[name='+name+']')?.value||'';}}
 vm.runInNewContext(fs.readFileSync('inquiry.js','utf8'),{
  window:runtime,document,FormData,localStorage:{getItem:()=>language},crypto:webcrypto,Date,AbortSignal,
  fetch:async(...args)=>{requests++;return options.fetch?options.fetch(...args):new Response(JSON.stringify({success:true,ticket_no:'AUP-100001'}));}
 });
 runtime.AUPInquiry.bind(form,()=>({}),()=>{},{context:options.context||(()=> 'tentang properti Ubud Villa')});
 return {window,document,runtime,form,requests:()=>requests,validations:()=>validations,setLanguage:v=>language=v,
  link:()=>form.querySelector('.inquiry-whatsapp'),body:()=>form.querySelector('.inquiry-ticket-fields'),toggle:()=>form.querySelector('.inquiry-ticket-toggle')};
}
const text=b=>new URL(b.link().getAttribute('href')).searchParams.get('text');

test('WhatsApp is the first choice and opens a context message without validating or submitting a ticket',()=>{
 const b=page();assert.equal(b.body().hidden,true);assert.equal(b.toggle().getAttribute('aria-expanded'),'false');
 assert.equal(b.link().target,'_blank');assert.equal(b.link().rel,'noopener noreferrer');
 assert.equal(new URL(b.link().href).pathname,'/6281234567890');
 b.link().dispatchEvent(new b.window.Event('click',{cancelable:true}));
 assert.equal(b.requests(),0);assert.equal(b.validations(),0);assert.match(text(b),/Ubud Villa/);
 assert.match(text(b),/https:\/\/example.test\/property\?slug=ubud-villa/);assert.doesNotMatch(text(b),/#inquiry/);
 assert.equal(b.document.querySelectorAll('.inquiry-channels').length,1);
 b.runtime.AUPInquiry.bind(b.form);assert.equal(b.document.querySelectorAll('.inquiry-channels').length,1);
});

test('ticket disclosure preserves entered fields and remains accessible by its controlled id',()=>{
 const b=page();b.toggle().click();assert.equal(b.body().hidden,false);
 assert.equal(b.document.getElementById(b.toggle().getAttribute('aria-controls')),b.body());
 b.form.querySelector('[name=name]').value='Customer';b.toggle().click();assert.equal(b.body().hidden,true);
 b.toggle().click();assert.equal(b.form.querySelector('[name=name]').value,'Customer');assert.equal(b.requests(),0);
});

test('missing or malformed WhatsApp leaves the ticket form available and never creates a bad destination',()=>{
 for(const number of ['', 'abc6281234567890', 'https://wa.me/6281234567890', '123', '+62 XXX']){
  const b=page(number);assert.equal(b.link().hasAttribute('href'),false);assert.equal(b.link().getAttribute('aria-disabled'),'true');
  assert.equal(b.body().hidden,false);assert.match(b.form.querySelector('.inquiry-channel-note').textContent,/belum tersedia/);
  const event=new b.window.Event('click',{cancelable:true});b.link().dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(b.requests(),0);
 }
});

test('delayed settings activate WhatsApp without collapsing a ticket the visitor has started',()=>{
 for(const started of [false,true]){
  const b=page('');if(started){const input=b.form.querySelector('[name=name]');input.value='Customer';input.dispatchEvent(new b.window.Event('input',{bubbles:true}));}
  b.runtime.AUP_PUBLIC_SETTINGS={whatsapp:'0812-3456-7890'};
  b.document.dispatchEvent(new b.window.CustomEvent('aup:settings-loaded'));
  assert.equal(new URL(b.link().href).pathname,'/6281234567890');assert.equal(b.body().hidden,!started);
  if(started)assert.equal(b.form.querySelector('[name=name]').value,'Customer');
  b.runtime.AUP_PUBLIC_SETTINGS={};b.document.dispatchEvent(new b.window.CustomEvent('aup:settings-loaded'));
  assert.equal(b.link().hasAttribute('href'),false);assert.equal(b.body().hidden,false);
 }
});

test('WhatsApp refreshes the selected public context on click and omits private ticket drafts',async()=>{
 let topic='tentang rental motor A';const b=page('6281234567890',{context:()=>topic});
 b.toggle().click();b.form.querySelector('[name=email]').value='private@example.invalid';b.form.querySelector('[name=message]').value='Private draft';
 topic='tentang rental motor B & C';b.link().click();assert.match(text(b),/B & C/);assert.doesNotMatch(text(b),/Private draft|private@example/);
 b.setLanguage('en');b.document.getElementById('languageToggle').click();await Promise.resolve();assert.match(b.link().textContent,/Chat on WhatsApp/);
 assert.equal(b.body().hidden,false);assert.match(text(b),/^Hello/);assert.equal(b.requests(),0);
});

test('ticket sending disables both channel controls and restores WhatsApp after the saved ticket is displayed',async()=>{
 let finish;const b=page('6281234567890',{fetch:()=>new Promise(resolve=>finish=resolve)});b.toggle().click();
 b.form.querySelector('[name=name]').value='Customer';b.form.querySelector('[name=email]').value='customer@example.invalid';b.form.querySelector('[name=message]').value='Please send details';
 b.form.dispatchEvent(new b.window.Event('submit',{cancelable:true}));assert.equal(b.requests(),1);assert.equal(b.toggle().disabled,true);assert.equal(b.link().hasAttribute('href'),false);
 b.form.dispatchEvent(new b.window.Event('submit',{cancelable:true}));assert.equal(b.requests(),1);
 finish(new Response(JSON.stringify({success:true,ticket_no:'AUP-100100'})));await new Promise(resolve=>setTimeout(resolve,10));
 assert.match(b.form.querySelector('.inquiry-status').textContent,/AUP-100100/);assert.equal(b.toggle().disabled,false);assert.ok(b.link().getAttribute('href'));assert.equal(b.body().hidden,false);
});
