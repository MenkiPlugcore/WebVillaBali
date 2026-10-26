import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../../supabase/functions/payments/handler.js';
import {validateOrder,approvalURL,createOrderBody} from '../../supabase/functions/payments/paypal.js';
const token='a'.repeat(64),id='10000000-0000-4000-8000-000000000831',orderId='PAYPALORDER1234567',captureId='PAYPALCAPTURE12345';
const baseInvoice={id,invoice_no:'AUP-INV-100001',checkout_token:token,status:'issued',payment_method:'paypal',paypal_environment:'sandbox',amount_minor:12550,currency:'USD',summary:'Villa deposit',order_id:orderId,create_request_id:'10000000-0000-4000-8000-000000000901',capture_request_id:'10000000-0000-4000-8000-000000000902',attempt_created_at:new Date().toISOString()};
function order(status='APPROVED'){return {id:orderId,intent:'CAPTURE',status,links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token='+orderId}],purchase_units:[{custom_id:id,invoice_id:baseInvoice.invoice_no,amount:{currency_code:'USD',value:'125.50'},payee:{merchant_id:'MERCHANT12345'},...(status==='COMPLETED'?{payments:{captures:[{id:captureId,status:'COMPLETED',amount:{currency_code:'USD',value:'125.50'},final_capture:true}]}}:{})}]};}
function fixture(options={}){
 const calls=[],invoice={...baseInvoice,...options.invoice};let currentOrder=order(options.status||'APPROVED');
 const config={connected:true,environment:'sandbox',client_id:'synthetic-client-1234567890',secret:'synthetic-secret-never-real',merchant_id:'MERCHANT12345',webhook_id:'WEBHOOK12345'};
 const fetcher=async(url,args={})=>{
  const body=args.body&&args.headers?.['Content-Type']!=='application/x-www-form-urlencoded'?JSON.parse(args.body):null;calls.push({url,args,body});
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'owner',app_metadata:{aup_role:'owner'}});
  if(url.endsWith('/rpc/payment_settings'))return options.denied?Response.json({code:'42501'},{status:403}):Response.json({can_manage:options.canManage!==false,revision:1,paypal_locked:false,actor:{sub:'owner'}});
  if(url.endsWith('/rpc/payments_backend')){
   const {p_action:action,p_payload:p}=body;
   if(action==='quota'||action==='webhook_quota')return Response.json({allowed:options.quota!==false});
   if(action==='credentials')return Response.json(config);
   if(action==='begin'||action==='order')return Response.json({...invoice});
   if(action==='bind')invoice.order_id=p.order_id;
   if(action==='paid')invoice.status='paid';
   if(action==='view')return Response.json({status:invoice.status,invoice_no:invoice.invoice_no});
   return Response.json({});
  }
  if(url.endsWith('/oauth2/token'))return Response.json({access_token:'synthetic-only-oauth-token'});
  if(url.endsWith('/verify-webhook-signature'))return Response.json({verification_status:options.signature===false?'FAILURE':'SUCCESS'});
  if(url.endsWith('/notifications/webhooks'))return Response.json(args.method==='POST'?{id:'WEBHOOK12345'}:{webhooks:[]});
  if(url.endsWith('/checkout/orders')&&args.method==='POST')return Response.json(order('CREATED'));
  if(url.endsWith('/capture')){currentOrder=order('COMPLETED');return options.captureTimeout?Promise.reject(Error('timeout')):Response.json(currentOrder);}
  if(url.endsWith('/checkout/orders/'+orderId))return Response.json(options.mismatch?{...currentOrder,purchase_units:[{...currentOrder.purchase_units[0],payee:{merchant_id:'WRONGMERCHANT'}}]}:currentOrder);
  throw Error('Unexpected request '+url);
 };
 async function send(body,{webhook=false,headers={}}={}){const r=await handle(new Request('https://example.supabase.co/functions/v1/payments'+(webhook?'/webhook/sandbox':''),{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://webvillabali.menkiestes.workers.dev',...headers},body:JSON.stringify(body)}),{url:'https://example.supabase.co',key:'synthetic-service-key'},fetcher);return {status:r.status,data:await r.json()};}
 return {calls,send,invoice};
}
test('PayPal order validation requires exact invoice, gross amount, currency, merchant and completed capture',()=>{
 assert.equal(validateOrder(order('COMPLETED'),baseInvoice,'MERCHANT12345',{completed:true}),captureId);
 for(const change of [o=>o.purchase_units[0].amount.value='1.00',o=>o.purchase_units[0].amount.currency_code='IDR',o=>o.purchase_units[0].custom_id='other',o=>o.purchase_units[0].payee.merchant_id='other',o=>o.purchase_units[0].payments.captures[0].status='PENDING',o=>o.purchase_units[0].payments.captures[0].final_capture=false,o=>o.purchase_units.push(o.purchase_units[0])]){const o=order('COMPLETED');change(o);assert.throws(()=>validateOrder(o,baseInvoice,'MERCHANT12345',{completed:true}));}
 assert.throws(()=>approvalURL({links:[{rel:'approve',href:'https://www.sandbox.paypal.com.evil.example/'}]},'sandbox'));
 const body=createOrderBody(baseInvoice,'MERCHANT12345');assert.equal(body.purchase_units[0].amount.value,'125.50');assert.match(body.payment_source.paypal.experience_context.return_url,/#a{64}$/);
});
test('capture resolves an ambiguous provider response by reading the same bound order and records it once',async()=>{
 const f=fixture({captureTimeout:true});assert.equal((await f.send({action:'capture',token})).status,200);assert.equal(f.invoice.status,'paid');
 const captures=f.calls.filter(c=>c.url.endsWith('/capture'));assert.equal(captures.length,1);assert.equal(captures[0].args.headers['PayPal-Request-Id'],baseInvoice.capture_request_id);
 const paid=f.calls.find(c=>c.body?.p_action==='paid').body.p_payload;assert.equal(paid.amount_minor,12550);assert.equal(paid.capture_id,captureId);assert.equal(paid.order_id,orderId);
});
test('order creation uses the stored amount and idempotency key; caller amount and order injection are rejected',async()=>{
 const f=fixture({invoice:{order_id:null}});const result=await f.send({action:'start',token});assert.equal(result.status,200);assert.match(result.data.approval_url,/www\.sandbox\.paypal\.com/);
 const create=f.calls.find(c=>c.url.endsWith('/checkout/orders'));assert.equal(create.args.headers['PayPal-Request-Id'],baseInvoice.create_request_id);assert.equal(create.body.purchase_units[0].amount.value,'125.50');
 for(const forged of [{amount_minor:1},{order_id:'OTHERORDER'},{status:'paid'}])assert.equal((await f.send({action:'capture',token,...forged})).status,400);
});
test('old ambiguous creates and wrong-merchant orders never start another charge or mark paid',async()=>{
 const old=fixture({invoice:{order_id:null,attempt_created_at:'2026-01-01T00:00:00Z'}});assert.equal((await old.send({action:'start',token})).status,409);assert.ok(!old.calls.some(c=>c.url.endsWith('/checkout/orders')));
 const wrong=fixture({mismatch:true});assert.equal((await wrong.send({action:'capture',token})).status,503);assert.equal(wrong.invoice.status,'issued');assert.ok(!wrong.calls.some(c=>c.body?.p_action==='paid'||c.url.endsWith('/capture')));
});
test('webhooks must pass signature verification before reading orders or changing invoices',async()=>{
 const body={id:'WH-SYNTHETIC-123',event_type:'PAYMENT.CAPTURE.COMPLETED',resource:{supplementary_data:{related_ids:{order_id:orderId}}}},headers=Object.fromEntries(['auth-algo','cert-url','transmission-id','transmission-sig','transmission-time'].map(n=>['paypal-'+n,'synthetic']));
 const bad=fixture({signature:false});assert.equal((await bad.send(body,{webhook:true,headers})).status,401);assert.ok(!bad.calls.some(c=>c.body?.p_action==='order'||c.body?.p_action==='paid'));
 const good=fixture({status:'COMPLETED'});assert.equal((await good.send(body,{webhook:true,headers})).status,200);assert.equal(good.invoice.status,'paid');assert.equal(good.calls.find(c=>c.body?.p_action==='paid').body.p_payload.event_id,body.id);
 const absent=fixture();assert.equal((await absent.send(body,{webhook:true})).status,401);assert.equal(absent.calls.length,0);
});
test('payment settings need a live permitted staff session; admin cannot change merchant credentials',async()=>{
 const body={action:'connect_paypal',environment:'sandbox',client_id:'synthetic-client-1234567890',secret:'synthetic-secret-never-real',merchant_id:'MERCHANT12345',confirmed:true};
 const missing=fixture();assert.equal((await missing.send(body)).status,401);assert.equal(missing.calls.length,0);
 for(const f of [fixture({denied:true}),fixture({canManage:false})]){assert.equal((await f.send(body,{headers:{Authorization:'Bearer synthetic'}})).status,403);assert.ok(!f.calls.some(c=>c.url.includes('paypal.com')));}
 const connected=fixture();const result=await connected.send(body,{headers:{Authorization:'Bearer synthetic'}});assert.equal(result.status,200);assert.equal(JSON.stringify(result.data).includes(body.secret),false);
 const save=connected.calls.find(c=>c.body?.p_action==='connect').body.p_payload;assert.equal(save.secret,body.secret);assert.equal(save.environment,'sandbox');assert.equal(save.webhook_id,'WEBHOOK12345');
});
test('exhausted webhook and checkout quotas stop before credentials, OAuth, orders or settlement',async()=>{
 const hook=fixture({quota:false}),headers=Object.fromEntries(['auth-algo','cert-url','transmission-id','transmission-sig','transmission-time'].map(n=>['paypal-'+n,'synthetic']));
 const body={id:'WH-SYNTHETIC-LIMIT',event_type:'PAYMENT.CAPTURE.COMPLETED'};
 assert.equal((await hook.send(body,{webhook:true,headers})).status,429);
 assert.equal(hook.calls.length,1);assert.equal(hook.calls[0].body.p_action,'webhook_quota');
 assert.deepEqual(hook.calls[0].body.p_payload,{environment:'sandbox'});
 const checkout=fixture({quota:false});assert.equal((await checkout.send({action:'capture',token})).status,429);
 assert.equal(checkout.calls.length,1);assert.deepEqual(checkout.calls[0].body.p_payload,{token,operation:'capture'});
});
test('malformed and oversized payment bodies never reach database or provider',async()=>{
 for(const body of ['[]','null','{','x'.repeat(65537)]){
  const response=await handle(new Request('https://example.supabase.co/functions/v1/payments',{method:'POST',headers:{'Content-Type':'application/json'},body}),{url:'https://example.supabase.co',key:'synthetic'},()=>{throw Error('Upstream must not run');});
  assert.equal(response.status,body.length>65536?413:400);
 }
});
