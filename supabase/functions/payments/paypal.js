const bases={sandbox:'https://api-m.sandbox.paypal.com',live:'https://api-m.paypal.com'};
export const paymentOrigin='https://webvillabali.menkiestes.workers.dev';
export function checkoutURL(token){if(!/^[a-f0-9]{64}$/.test(token||''))throw Error('TOKEN');return paymentOrigin+'/pay#'+token;}
export function approvalURL(order,environment){
 const link=order.links?.find(link=>['payer-action','approve'].includes(link.rel));
 const url=new URL(link?.href||'https://invalid.example');
 if(url.protocol!=='https:'||url.hostname!==(environment==='live'?'www.paypal.com':'www.sandbox.paypal.com')||url.username||url.password||url.port)throw Error('PAYPAL_RESPONSE');
 return url.href;
}
export function validateOrder(order,invoice,merchant,{completed=false}={}){
 const units=order.purchase_units;
 if(order.id!==invoice.order_id||order.intent!=='CAPTURE'||units?.length!==1)throw Error('PAYPAL_MISMATCH');
 const unit=units[0],amount=(invoice.amount_minor/100).toFixed(2);
 if(unit.custom_id!==invoice.id||unit.invoice_id!==invoice.invoice_no||unit.amount?.currency_code!=='USD'||unit.amount?.value!==amount||unit.payee?.merchant_id!==merchant)throw Error('PAYPAL_MISMATCH');
 if(!completed)return null;
 const captures=unit.payments?.captures;
 if(order.status!=='COMPLETED'||captures?.length!==1||captures[0].status!=='COMPLETED'||captures[0].amount?.currency_code!=='USD'||captures[0].amount?.value!==amount||captures[0].final_capture!==true||!/^[A-Z0-9]{10,32}$/.test(captures[0].id))throw Error('PAYPAL_PENDING');
 return captures[0].id;
}
export function createOrderBody(invoice,merchant){
 return {intent:'CAPTURE',purchase_units:[{reference_id:invoice.id,custom_id:invoice.id,invoice_id:invoice.invoice_no,description:invoice.summary.slice(0,127),payee:{merchant_id:merchant},amount:{currency_code:'USD',value:(invoice.amount_minor/100).toFixed(2)}}],payment_source:{paypal:{experience_context:{brand_name:'Agung Ubud Property',shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW',return_url:paymentOrigin+'/pay?return=paypal#'+invoice.checkout_token,cancel_url:paymentOrigin+'/pay?cancel=paypal#'+invoice.checkout_token}}}};
}
export function paypalClient(config,fetcher=fetch){
 const base=bases[config.environment];if(!base)throw Error('CONFIG');let token;
 async function access(){
  if(token)return token;
  const response=await fetcher(base+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+btoa(config.client_id+':'+config.secret),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000),redirect:'error'});
  if(!response.ok)throw Error('PAYPAL_AUTH');const data=await response.json();if(typeof data.access_token!=='string'||!data.access_token)throw Error('PAYPAL_AUTH');token=data.access_token;return token;
 }
 async function request(path,{method='GET',body,requestId}={}){
  const response=await fetcher(base+path,{method,headers:{Authorization:'Bearer '+await access(),'Content-Type':'application/json',Prefer:'return=representation',...(requestId?{'PayPal-Request-Id':requestId}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000),redirect:'error'});
  if(!response.ok)throw Error(response.status===404?'PAYPAL_NOT_FOUND':'PAYPAL_API');
  return response.status===204?null:response.json();
 }
 return {access,request};
}
