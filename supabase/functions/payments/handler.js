import {paypalClient,createOrderBody,validateOrder,approvalURL,paymentOrigin} from './paypal.js';
const origins=[paymentOrigin,'https://agungubudproperty.com','https://www.agungubudproperty.com'];
async function json(req){let size=0,parts=[];const reader=req.body?.getReader();if(!reader)throw Error('INPUT');for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw Error('SIZE');}parts.push(value);}const all=new Uint8Array(size);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}return JSON.parse(new TextDecoder().decode(all));}
export async function handle(req,env,fetcher=fetch){
 const origin=req.headers.get('origin'),webhook=new URL(req.url).pathname.match(/\/webhook\/(sandbox|live)$/);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin'};
 const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(origin&&!origins.includes(origin))return reply({error:'Origin ditolak.'},403);
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Metode tidak tersedia.'},405);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Gunakan JSON.'},415);
 const service={apikey:env.key,Authorization:'Bearer '+env.key,'Content-Type':'application/json'};
 async function rpc(name,args,caller=service){const r=await fetcher(env.url+'/rest/v1/rpc/'+name,{method:'POST',headers:caller,body:JSON.stringify(args),signal:AbortSignal.timeout(15000)});const data=await r.json();if(!r.ok)throw Object.assign(Error('DATABASE'),{status:({'42501':403,'22023':400,'P0002':404,'40001':409,'54000':429})[data.code]||503});return data;}
 const backend=(action,payload={})=>rpc('payments_backend',{p_action:action,p_payload:payload});
 try{
  const body=await json(req);if(!body||typeof body!=='object'||Array.isArray(body))throw Error('INPUT');
  if(webhook){
   if(typeof body.id!=='string'||body.id.length>100||typeof body.event_type!=='string')throw Error('INPUT');
   const names=['auth-algo','cert-url','transmission-id','transmission-sig','transmission-time'],verification={};
   for(const name of names){const v=req.headers.get('paypal-'+name);if(!v||v.length>4096)throw Error('SIGNATURE');verification[name.replaceAll('-','_')]=v;}
   // The certificate URL is sent to PayPal for verification, never fetched by this server.
   const config=await backend('credentials',{environment:webhook[1]});if(!config.connected)throw Error('CONFIG');const paypal=paypalClient(config,fetcher);
   const checked=await paypal.request('/v1/notifications/verify-webhook-signature',{method:'POST',body:{...verification,webhook_id:config.webhook_id,webhook_event:body}});
   if(checked.verification_status!=='SUCCESS')throw Error('SIGNATURE');
   if(['PAYMENT.CAPTURE.COMPLETED','CHECKOUT.ORDER.APPROVED'].includes(body.event_type)){
    const id=body.event_type==='CHECKOUT.ORDER.APPROVED'?body.resource?.id:body.resource?.supplementary_data?.related_ids?.order_id;
    if(!/^[A-Z0-9]{10,32}$/.test(id||''))throw Error('INPUT');
    const invoice=await backend('order',{order_id:id});if(!invoice)return reply({received:true});
    await settle(invoice,config,paypal,body.id);
   }else if(['PAYMENT.CAPTURE.REFUNDED','PAYMENT.CAPTURE.REVERSED','CUSTOMER.DISPUTE.CREATED','CUSTOMER.DISPUTE.RESOLVED'].includes(body.event_type)){
    const up=body.resource?.links?.find(x=>x.rel==='up')?.href||'';
    const fromLink=up.match(/^https:\/\/api(?:-m)?(?:\.sandbox)?\.paypal\.com\/v2\/payments\/captures\/([A-Z0-9]{10,32})$/)?.[1];
    const ids=[body.resource?.supplementary_data?.related_ids?.capture_id,fromLink,...(body.resource?.disputed_transactions||[]).slice(0,10).map(x=>x.seller_transaction_id)].filter(x=>/^[A-Z0-9]{10,32}$/.test(x||''));
    for(const capture_id of new Set(ids))await backend('review',{capture_id,event_id:body.id,event_type:body.event_type});
   }
   return reply({received:true});
  }
  if(['connect_paypal','settings','save_bca'].includes(body.action)){
   const authorization=req.headers.get('authorization');if(!authorization?.startsWith('Bearer '))return reply({error:'Silakan masuk.'},401);
   const caller={...service,Authorization:authorization};
   const authenticated=await fetcher(env.url+'/auth/v1/user',{headers:caller,signal:AbortSignal.timeout(10000)});if(!authenticated.ok)return reply({error:'Sesi tidak valid.'},401);
   const settings=await rpc('payment_settings',{p_action:'get'},caller);
   if(body.action==='settings')return reply(settings);
   if(!settings.can_manage)return reply({error:'Hanya owner/developer yang dapat mengatur pembayaran.'},403);
   if(body.action==='save_bca')return reply(await rpc('payment_settings',{p_action:'save_bca',p_payload:{account_name:body.account_name,account_number:body.account_number}},caller));
   if(!['sandbox','live'].includes(body.environment)||!/^[A-Za-z0-9_-]{20,256}$/.test(body.client_id||'')||!/^[\x21-\x7e]{20,256}$/.test(body.secret||'')||!/^[A-Z0-9]{8,32}$/.test(body.merchant_id||'')||body.confirmed!==true)throw Error('INPUT');
   if(settings.paypal_locked&&settings.paypal_environment===body.environment)throw Object.assign(Error('DATABASE'),{status:409});
   const config={environment:body.environment,client_id:body.client_id,secret:body.secret,merchant_id:body.merchant_id},paypal=paypalClient(config,fetcher);await paypal.access();
   const url=env.url+'/functions/v1/payments/webhook/'+body.environment;
   const existing=await paypal.request('/v1/notifications/webhooks');
   const events=['CHECKOUT.ORDER.APPROVED','PAYMENT.CAPTURE.COMPLETED','PAYMENT.CAPTURE.PENDING','PAYMENT.CAPTURE.REFUNDED','PAYMENT.CAPTURE.REVERSED','CUSTOMER.DISPUTE.CREATED','CUSTOMER.DISPUTE.RESOLVED'].map(name=>({name}));
   let hook=existing.webhooks?.find(h=>h.url===url);
   if(hook)hook=await paypal.request('/v1/notifications/webhooks/'+encodeURIComponent(hook.id),{method:'PATCH',body:[{op:'replace',path:'/event_types',value:events}]}).then(()=>hook);
   else hook=await paypal.request('/v1/notifications/webhooks',{method:'POST',body:{url,event_types:events}});
   if(typeof hook?.id!=='string'||!/^[A-Z0-9-]{5,100}$/.test(hook.id))throw Error('PAYPAL_RESPONSE');
   // Re-check the live owner/session after external API calls, then commit atomically.
   const fresh=await rpc('payment_settings',{p_action:'get'},caller);
   await backend('connect',{...config,webhook_id:hook.id,actor:fresh.actor,expected_revision:settings.revision});
   return reply(await rpc('payment_settings',{p_action:'get'},caller));
  }
  if(!['view','start','capture'].includes(body.action)||!/^[a-f0-9]{64}$/.test(body.token||'')||Object.keys(body).some(k=>!['action','token'].includes(k)))throw Error('INPUT');
  const quota=await backend('quota',{token:body.token});if(quota.missing)return reply({error:'Tagihan tidak ditemukan atau tautan tidak aktif.'},404);if(!quota.allowed)return reply({error:'Terlalu banyak permintaan. Coba lagi sebentar.'},429);
  if(body.action==='view')return reply(await backend('view',{token:body.token}));
  const invoice=await backend('begin',{token:body.token});
  if(invoice.status==='paid')return reply({paid:true});
  const config=await backend('credentials',{environment:invoice.paypal_environment});if(!config.connected||config.environment!==invoice.paypal_environment)throw Error('CONFIG');const paypal=paypalClient(config,fetcher);
  if(body.action==='start'){
   let order;
   if(invoice.order_id)order=await paypal.request('/v2/checkout/orders/'+invoice.order_id);
   else{
    if(Date.now()-Date.parse(invoice.attempt_created_at)>5*3600000)throw Error('RECONCILE');
    order=await paypal.request('/v2/checkout/orders',{method:'POST',requestId:invoice.create_request_id,body:createOrderBody(invoice,config.merchant_id)});
    if(!/^[A-Z0-9]{10,32}$/.test(order.id||''))throw Error('PAYPAL_RESPONSE');invoice.order_id=order.id;
    validateOrder(order,invoice,config.merchant_id);
    await backend('bind',{invoice_id:invoice.id,order_id:order.id});
   }
   validateOrder(order,invoice,config.merchant_id);
   if(['APPROVED','COMPLETED'].includes(order.status)){await settle(invoice,config,paypal);return reply(await backend('view',{token:body.token}));}
   return reply({approval_url:approvalURL(order,config.environment)});
  }
  if(!invoice.order_id)throw Error('INPUT');await settle(invoice,config,paypal);return reply(await backend('view',{token:body.token}));
  async function settle(invoice,config,paypal,event_id){
   let order=await paypal.request('/v2/checkout/orders/'+invoice.order_id);validateOrder(order,invoice,config.merchant_id);
   if(order.status==='APPROVED'){
    await backend('capture_begin',{invoice_id:invoice.id,order_id:invoice.order_id});
    try{await paypal.request('/v2/checkout/orders/'+invoice.order_id+'/capture',{method:'POST',requestId:invoice.capture_request_id,body:{}});}catch{ /* The read below resolves an already-captured or ambiguous response. */ }
    order=await paypal.request('/v2/checkout/orders/'+invoice.order_id);
   }
   const capture_id=validateOrder(order,invoice,config.merchant_id,{completed:true});
   await backend('paid',{invoice_id:invoice.id,order_id:invoice.order_id,capture_id,amount_minor:invoice.amount_minor,currency:'USD',environment:config.environment,event_id:event_id||'capture:'+capture_id});
  }
 }catch(error){
  if(error.message==='SIGNATURE')return reply({error:'Notifikasi tidak valid.'},401);
  if(error.message==='SIZE')return reply({error:'Isian terlalu besar.'},413);
  if(error.message==='INPUT'||error instanceof SyntaxError)return reply({error:'Periksa isian atau tautan pembayaran.'},400);
  if(error.message==='PAYPAL_PENDING')return reply({error:'Pembayaran belum selesai. Periksa kembali setelah persetujuan PayPal.'},409);
  if(error.message==='RECONCILE')return reply({error:'Percobaan pembayaran perlu diperiksa pengelola. Jangan membuat pembayaran kedua.'},409);
  if(error.status)return reply({error:error.status===404?'Tagihan tidak ditemukan atau tautan tidak aktif.':error.status===403?'Akses ditolak. Masuk ulang dengan akun yang berwenang.':error.status===409?'Data berubah atau pembayaran sedang berjalan. Muat ulang sebelum melanjutkan.':'Pengaturan atau tagihan belum siap. Periksa isian.'},error.status);
  return reply({error:error.message==='PAYPAL_AUTH'?'Kredensial PayPal belum cocok dengan lingkungan yang dipilih.':'Pembayaran belum dapat diproses. Coba periksa status kembali; jangan membayar dua kali.'},503);
 }
}
