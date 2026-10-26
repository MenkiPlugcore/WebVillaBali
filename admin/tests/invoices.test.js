import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {parseInvoiceAmount,invoiceMoney,invoicePayload,invoicePrintHTML,loadInvoices,clearInvoicePrint} from '../invoices.js';

const row={id:'10000000-0000-4000-8000-000000000831',revision:1,invoice_no:'AUP-INV-100001',inquiry_id:'10000000-0000-4000-8000-000000000821',ticket_no:'AUP-100099',customer_name:'Customer',customer_email:'customer@example.invalid',customer_language:'en',summary:'Villa deposit',payment_kind:'deposit',payment_method:'bca',currency:'IDR',amount_minor:1500000,due_date:'2030-01-05',status:'draft',notes:'Customer note',terms:'Agreed cancellation terms.',bca_account_name:'Synthetic merchant',bca_account_number:'1234567890'};
function install(){
 const {window,document}=parseHTML('<html><body><main><section id="content"></section></main></body></html>');
 Object.assign(globalThis,{window,document,FormData:class {constructor(form){this.form=form;}get(name){const el=this.form.querySelector('[name='+name+']');return !el||el.disabled?null:el.type==='checkbox'?(el.checked?'on':null):el.value;}}});
 const values=new WeakMap();Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return values.get(this)??[...this.options].find(o=>o.hasAttribute('selected'))?.value??this.options[0]?.value??'';},set(v){values.set(this,v);}});
 window.print=()=>{};return {window,document,container:document.getElementById('content')};
}
async function screen(overrides={},handler){
 const ui=install(),calls=[];const db={rpc:async(name,args)=>{calls.push({name,...args});if(handler)return handler(args.p_action,args.p_payload);return {data:args.p_action==='list'?{rows:[{...row,...overrides}],total:1}:args.p_action==='tickets'?{rows:[{id:row.inquiry_id,ticket_no:row.ticket_no,name:row.customer_name}]}:{invoice:{...row,...overrides},events:[]}};}};
 await loadInvoices(db,ui.container);return {...ui,calls};
}
test('invoice amount parsing preserves cents and rejects ambiguous or unsafe numbers',()=>{
 assert.equal(parseInvoiceAmount('1500000','IDR'),1500000);assert.equal(parseInvoiceAmount('125.50','USD'),12550);assert.equal(parseInvoiceAmount('0.01','USD'),1);assert.equal(parseInvoiceAmount('9000000000000','IDR'),9000000000000);
 for(const [value,currency] of [['1.500.000','IDR'],['1.5','IDR'],['125,50','USD'],['1e4','USD'],['0','IDR'],['-1','USD'],['1.005','USD'],['9000000000001','IDR'],['1','EUR']])assert.throws(()=>parseInvoiceAmount(value,currency));
 assert.match(invoiceMoney(12550,'USD'),/125\.50/);assert.match(invoiceMoney(1500000,'IDR'),/1\.500\.000/);
});
test('draft payload contains server-facing minor units and never forwards status or customer identity',()=>{
 const data={payment_method:'paypal',amount:'125.50',inquiry_id:row.inquiry_id,payment_kind:'deposit',summary:'Deposit',due_date:'2030-01-05',status:'paid',customer_name:'Forged',bca_account_number:'1234567890'};
 const payload=invoicePayload({get:key=>data[key]}, {id:row.id});assert.equal(payload.amount_minor,12550);assert.equal(payload.currency,'USD');assert.equal(payload.bca_account_number,'');assert.equal(payload.expected_revision,0);assert.equal(payload.status,undefined);assert.equal(payload.customer_name,undefined);
});
test('print output escapes all customer, account and message content and marks drafts',()=>{
 const html=invoicePrintHTML({...row,customer_name:'<img src=x onerror=alert(1)>',summary:'<script>bad()</script>',bca_account_name:'<b>Bank</b>',terms:'Line 1\nLine 2'});
 assert.doesNotMatch(html,/<script|<img|<b>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/DRAFT/);assert.match(html,/Line 1\nLine 2/);assert.match(html,/Bill to/);assert.match(invoicePrintHTML({...row,customer_language:'id'}),/Ditagihkan kepada/);
});
test('invoice list preserves search and status filters and opens details through the RPC',async()=>{
 const s=await screen();assert.match(s.document.querySelector('h1').textContent,/Invoice/);s.document.querySelector('#invoice-filters [name=search]').value='AUP-INV';s.document.querySelector('#invoice-filters [name=status]').value='draft';await s.document.querySelector('#invoice-filters').onsubmit({preventDefault(){},target:s.document.querySelector('#invoice-filters')});assert.deepEqual(s.calls.at(-1).p_payload,{search:'AUP-INV',status:'draft',page:0});await s.document.querySelector('[data-invoice-id]').onclick();assert.equal(s.calls.at(-1).p_action,'get');assert.ok(s.document.querySelector('#invoice-issue'));
});
test('changing BCA to PayPal clears the amount and hides account inputs',async()=>{
 const s=await screen();await s.document.querySelector('#new-invoice').onclick();const form=s.document.querySelector('#invoice-editor-form');form.querySelector('[name=amount]').value='1500000';form.querySelector('[name=payment_method]').value='paypal';form.querySelector('[name=payment_method]').onchange();assert.equal(form.querySelector('[name=amount]').value,'');assert.equal(form.querySelector('#invoice-bca-fields').hidden,true);assert.equal(form.querySelector('[name=bca_account_number]').disabled,true);assert.match(form.querySelector('#invoice-amount-preview').textContent,/USD/);
});
test('a failed draft save keeps fields and the same UUID for a safe retry',async()=>{
 let saves=0;const s=await screen({},async(action,payload)=>{
  if(action==='list')return {data:{rows:[],total:0}};if(action==='tickets')return {data:{rows:[{id:row.inquiry_id,ticket_no:row.ticket_no,name:row.customer_name}]}};
  if(action==='save'){saves++;return saves===1?{error:{message:'Network unavailable'}}:{data:{invoice:{...row,id:payload.id},events:[]}};}
 });
 await s.document.querySelector('#new-invoice').onclick();const form=s.document.querySelector('#invoice-editor-form');for(const [name,value] of Object.entries({inquiry_id:row.inquiry_id,summary:'Keep my draft',amount:'1500000',due_date:'2030-01-05'}))form.querySelector('[name='+name+']').value=value;
 await form.onsubmit({preventDefault(){}});assert.equal(form.querySelector('[name=summary]').value,'Keep my draft');assert.match(s.document.querySelector('[data-invoice-error]').textContent,/Network/);const first=s.calls.at(-1).p_payload.id;await form.onsubmit({preventDefault(){}});assert.equal(s.calls.at(-1).p_payload.id,first);assert.ok(s.document.querySelector('#invoice-edit'));
});
test('concurrent save clicks create one request and prevent navigation until finished',async()=>{
 let finish,saves=0;const ui=install();let busy=false;const db={rpc:async(name,{p_action})=>p_action==='tickets'?{data:{rows:[{id:row.inquiry_id,ticket_no:row.ticket_no,name:row.customer_name}]}}:p_action==='save'?(saves++,new Promise(resolve=>finish=resolve)):{data:{rows:[],total:0}}};await loadInvoices(db,ui.container,{onBusy:value=>busy=value});await ui.document.querySelector('#new-invoice').onclick();const form=ui.document.querySelector('#invoice-editor-form');for(const [name,value] of Object.entries({inquiry_id:row.inquiry_id,summary:'Deposit',amount:'1500000',due_date:'2030-01-05'}))form.querySelector('[name='+name+']').value=value;const one=form.onsubmit({preventDefault(){}});await new Promise(r=>setTimeout(r,0));await form.onsubmit({preventDefault(){}});assert.equal(saves,1);assert.equal(busy,true);finish({data:{invoice:row,events:[]}});await one;assert.equal(busy,false);
});
test('PayPal drafts have no issue or manual settlement path in the panel',async()=>{
 const s=await screen({payment_method:'paypal',currency:'USD',amount_minor:12550});await s.document.querySelector('[data-invoice-id]').onclick();assert.equal(s.document.querySelector('#invoice-issue').disabled,true);assert.equal(s.document.querySelector('#invoice-confirm-bca'),null);assert.match(s.document.querySelector('.help').textContent,/Hubungkan akun/);
});
test('a connected PayPal draft can be issued and stays outside manual BCA settlement',async()=>{
 const paypal={...row,payment_method:'paypal',currency:'USD',amount_minor:12550};const s=await screen({},async action=>({data:action==='list'?{rows:[paypal],total:1,settings:{paypal_connected:true,paypal_environment:'sandbox'}}:{invoice:paypal,events:[],settings:{paypal_connected:true,paypal_environment:'sandbox'}}}));await s.document.querySelector('[data-invoice-id]').onclick();assert.equal(s.document.querySelector('#invoice-issue').disabled,false);assert.equal(s.document.querySelector('#invoice-confirm-bca'),null);assert.match(s.document.querySelector('.help').textContent,/Sandbox/);
});
test('new BCA drafts use configured defaults while issued invoice snapshots keep their own account',async()=>{
 const s=await screen({},async action=>({data:action==='list'?{rows:[],total:0,settings:{bca_account_name:'Configured owner',bca_account_number:'9876543210'}}:{rows:[],settings:{bca_account_name:'Configured owner',bca_account_number:'9876543210'}}}));await s.document.querySelector('#new-invoice').onclick();assert.equal(s.document.querySelector('[name=bca_account_name]').value,'Configured owner');assert.equal(s.document.querySelector('[name=bca_account_number]').value,'9876543210');
 const link='a'.repeat(64),printed=invoicePrintHTML({...row,status:'issued',payment_method:'paypal',currency:'USD',checkout_token:link,paypal_environment:'sandbox'});assert.match(printed,/SANDBOX/);assert.match(printed,/\/pay#a{64}/);assert.doesNotMatch(invoicePrintHTML({...row,checkout_token:link}),/\/pay#/);
});
test('manual BCA confirmation sends exact minor units, revision and explicit verification',async()=>{
 const s=await screen({status:'issued',revision:2});await s.document.querySelector('[data-invoice-id]').onclick();const form=s.document.querySelector('#invoice-confirm-bca');form.querySelector('[name=reference]').value='BANK-123';form.querySelector('[name=received]').value='1500000';form.querySelector('[name=verified]').checked=true;await form.onsubmit({preventDefault(){}});const last=s.calls.at(-1);assert.equal(last.p_action,'confirm_bca');assert.deepEqual(last.p_payload,{id:row.id,expected_revision:2,reference:'BANK-123',amount_minor:1500000,currency:'IDR',verified:true});
});
test('paid invoices expose neither editing, issuing, cancellation nor settlement controls',async()=>{
 const s=await screen({status:'paid'});await s.document.querySelector('[data-invoice-id]').onclick();for(const selector of ['#invoice-edit','#invoice-issue','#invoice-cancel-form','#invoice-confirm-bca'])assert.equal(s.document.querySelector(selector),null);assert.ok(s.document.querySelector('#invoice-print-button'));
});
test('revoked authorization stops invoice reads before sending an RPC',async()=>{
 const ui=install();let requests=0;await loadInvoices({rpc:async()=>{requests++;}},ui.container,{authorize:async()=>{throw Error('Sesi dicabut');}});assert.equal(requests,0);assert.match(ui.container.textContent,/Sesi dicabut/);
});
test('navigation prevents late invoice responses from replacing another section',async()=>{
 const ui=install();let current=true,finish;const loading=loadInvoices({rpc:()=>new Promise(resolve=>finish=resolve)},ui.container,{isCurrent:()=>current});await new Promise(r=>setTimeout(r,0));current=false;ui.container.textContent='Other section';finish({data:{rows:[row],total:1}});await loading;assert.equal(ui.container.textContent,'Other section');
});
test('closing or signing out removes the printable customer data',()=>{
 const ui=install();const section=ui.document.createElement('section');section.id='invoice-print';section.textContent='Private customer';ui.document.body.appendChild(section);ui.document.body.classList.add('invoice-printing');clearInvoicePrint();assert.equal(ui.document.getElementById('invoice-print'),null);assert.equal(ui.document.body.classList.contains('invoice-printing'),false);
});
test('printing rechecks authorization and fetches the latest invoice status',async()=>{
 let reads=0;const s=await screen({},async(action)=>action==='list'?{data:{rows:[row],total:1}}:{data:{invoice:{...row,status:++reads>1?'paid':'issued'},events:[]}});await s.document.querySelector('[data-invoice-id]').onclick();await s.document.querySelector('#invoice-print-button').onclick();assert.equal(reads,2);assert.match(s.document.querySelector('#invoice-print .badge').textContent,/Paid/);clearInvoicePrint();
});
