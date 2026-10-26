import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
const source=await readFile(new URL('../public-payments.js',import.meta.url),'utf8');let iteration=0;
const first='a'.repeat(64),second='b'.repeat(64),third='c'.repeat(64);
const invoice={invoice_no:'AUP-INV-100001',summary:'Villa deposit',amount_minor:12550,currency:'USD',status:'issued',due_date:'2030-01-05',terms:'Agreed cancellation terms.',notes:'',language:'en',payment_method:'paypal',paypal_environment:'sandbox',payment_review:'',expired:false};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function open(handler){
 const {window,document}=parseHTML('<html><body><button id="payment-language"></button><main id="payment-app"></main></body></html>'),calls=[],destinations=[];
 const location={hash:'#'+first,search:'',assign:url=>destinations.push(url)};
 Object.assign(globalThis,{window,document,location,fetch:async(url,args)=>{const body=JSON.parse(args.body);calls.push(body);return handler?handler(body):Response.json(invoice);}});
 await import('data:text/javascript;base64,'+Buffer.from(source+'\n// '+iteration++).toString('base64'));
 async function change(token){location.hash='#'+token;window.dispatchEvent(new window.Event('hashchange'));await tick();}
 return {window,document,location,calls,destinations,change};
}
test('switching invoice links clears the old invoice and ignores a late response from the previous link',async()=>{
 let release;const s=await open(body=>body.token===second?new Promise(resolve=>release=()=>resolve(Response.json({...invoice,summary:'Second invoice'}))):Response.json({...invoice,summary:body.token===third?'Third invoice':'First invoice'}));
 await s.change(second);assert.doesNotMatch(s.document.querySelector('main').textContent,/First invoice/);await s.change(third);assert.match(s.document.querySelector('main').textContent,/Third invoice/);release();await tick();assert.match(s.document.querySelector('main').textContent,/Third invoice/);assert.doesNotMatch(s.document.querySelector('main').textContent,/Second invoice/);
 await s.change('invalid');assert.match(s.document.querySelector('main').textContent,/unavailable/);assert.equal(s.document.querySelector('#payment-start'),null);
});
test('checkout escapes invoice text and refuses a redirected payment destination outside PayPal',async()=>{
 const s=await open(body=>Response.json(body.action==='start'?{approval_url:'https://www.sandbox.paypal.com.evil.example/'}:{...invoice,summary:'<img src=x onerror=alert(1)>'}));assert.equal(s.document.querySelector('main img'),null);assert.match(s.document.querySelector('main').textContent,/<img/);s.document.querySelector('#payment-start').click();await tick();assert.equal(s.destinations.length,0);assert.match(s.document.querySelector('#payment-error').textContent,/Invalid payment destination/);
});
test('a pending capture keeps the unpaid screen and a verified paid response removes payment controls',async()=>{
 let paid=false;const s=await open(body=>body.action==='capture'&&!paid?Response.json({error:'Pending'},{status:409}):Response.json({...invoice,status:paid?'paid':'issued'}));s.document.querySelector('#payment-check').click();await tick();assert.ok(s.document.querySelector('#payment-start'));assert.equal(s.document.querySelector('.payment-state.paid'),null);assert.ok(s.document.querySelector('#payment-error').textContent);paid=true;s.document.querySelector('#payment-refresh').click();await tick();assert.ok(s.document.querySelector('.payment-state.paid'));assert.equal(s.document.querySelector('#payment-start'),null);
});
