import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {loadPaymentSettings} from '../payments.js';
const settings={can_manage:true,bca_account_name:'Owner',bca_account_number:'1234567890',paypal_connected:false,paypal_environment:'sandbox'};
async function screen(options={}){
 const {window,document}=parseHTML('<html><body><main id="content"></main></body></html>');
 Object.assign(globalThis,{window,document,FormData:class{constructor(form){this.values=[...form.querySelectorAll('[name]')].filter(el=>el.type!=='checkbox'||el.checked).map(el=>[el.name,el.type==='checkbox'?'on':el.value]);}get(k){return this.values.find(([name])=>name===k)?.[1]??null;}[Symbol.iterator](){return this.values[Symbol.iterator]();}}});
 const selected=new WeakMap();Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return selected.get(this)??[...this.options].find(o=>o.hasAttribute('selected'))?.value??this.options[0]?.value;},set(v){selected.set(this,v);}});
 const calls=[],dirty=[];globalThis.fetch=async(url,args)=>{const body=JSON.parse(args.body);calls.push(body);return options.fail?Response.json({error:'Network retry'},{status:503}):Response.json({...settings,paypal_connected:body.action==='connect_paypal',paypal_environment:body.environment||'sandbox'});};
 const db={auth:{getSession:async()=>({data:{session:{access_token:'synthetic-token'}}})},rpc:async()=>({data:{...settings,...options.settings}})};
 await loadPaymentSettings(db,document.querySelector('main'),{authorize:async()=>{},isCurrent:()=>true,onNotice(){},onDirty:v=>dirty.push(v),onBusy(){},onError:e=>e.message});return {document,calls,dirty};
}
test('saving BCA preserves unsaved PayPal inputs; successful connection clears the submitted secret',async()=>{
 const s=await screen(),bank=s.document.querySelector('#bca-settings'),paypal=s.document.querySelector('#paypal-settings');
 paypal.querySelector('[name=secret]').value='synthetic-secret-only';paypal.oninput();bank.oninput();await bank.onsubmit({preventDefault(){}});
 assert.equal(paypal.querySelector('[name=secret]').value,'synthetic-secret-only');assert.equal(s.dirty.at(-1),true);assert.equal(s.calls[0].action,'save_bca');
 paypal.querySelector('[name=client_id]').value='synthetic-client-id-only';paypal.querySelector('[name=merchant_id]').value='MERCHANT12345';paypal.querySelector('[name=confirmed]').checked=true;await paypal.onsubmit({preventDefault(){}});
 assert.equal(s.calls[1].confirmed,true);assert.equal(paypal.querySelector('[name=secret]').value,'');assert.equal(s.document.querySelector('#paypal-state').textContent,'Tersambung · Sandbox');assert.equal(s.dirty.at(-1),false);assert.equal(paypal.querySelector('button').disabled,false);
});
test('failed payment settings writes keep the fields and allow retry without a success state',async()=>{
 const s=await screen({fail:true}),form=s.document.querySelector('#paypal-settings');form.querySelector('[name=secret]').value='synthetic-secret-only';await form.onsubmit({preventDefault(){}});assert.match(form.querySelector('[data-error]').textContent,/Network retry/);assert.equal(form.querySelector('[name=secret]').value,'synthetic-secret-only');assert.equal(form.querySelector('button').disabled,false);assert.equal(s.document.querySelector('#paypal-state').textContent,'Belum tersambung');
});
test('operational admins can read BCA defaults but cannot submit bank or PayPal changes',async()=>{
 const s=await screen({settings:{can_manage:false}});assert.equal(s.document.querySelector('#paypal-settings'),null);assert.ok(s.document.querySelector('#bca-name').hasAttribute('readonly'));await s.document.querySelector('#bca-settings').onsubmit({preventDefault(){}});assert.equal(s.calls.length,0);assert.equal(s.document.querySelector('[name=secret]'),null);
});
