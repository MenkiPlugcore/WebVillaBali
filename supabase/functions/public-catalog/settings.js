export const settingKeys={contact:['email','phone','whatsapp','address'],social_links:['instagram','facebook','youtube','tiktok']};
const hosts={instagram:['instagram.com','www.instagram.com'],facebook:['facebook.com','www.facebook.com','m.facebook.com'],youtube:['youtube.com','www.youtube.com','youtu.be'],tiktok:['tiktok.com','www.tiktok.com']};
export function normalizeSetting(key,field,input){
 const value=typeof input==='string'?input.trim():'';if(!value)return '';
 if(value.length>(field==='address'?500:300))throw Error('Isian '+field+' terlalu panjang.');
 if(key==='contact'){
  if(field==='email'){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||/[<>"?&#]/.test(value))throw Error('Format email belum benar.');return value;}
  if(field==='phone'||field==='whatsapp'){if(!/^[+\d\s().-]+$/.test(value))throw Error('Nomor telepon/WhatsApp harus berupa nomor lengkap.');let number=value.replace(/\D/g,'');if(number.startsWith('00'))number=number.slice(2);if(number.startsWith('0'))number='62'+number.slice(1);if(!/^[1-9]\d{6,14}$/.test(number))throw Error('Gunakan nomor dengan kode negara, misalnya 62812…');return field==='phone'?'+'+number:number;}
  if(field==='address')return value;
 }
 if(key==='social_links'&&hosts[field]){let url;try{url=new URL(value);}catch{throw Error('Isi URL lengkap '+field+', diawali https://.');}if(url.protocol!=='https:'||url.username||url.password||!hosts[field].includes(url.hostname)||url.port)throw Error('Gunakan tautan HTTPS resmi '+field+'.');return url.href;}
 return '';
}
export function publicSettings(rows){const result={contact:{},social_links:{}};for(const row of rows){for(const field of settingKeys[row.key]||[]){try{const value=normalizeSetting(row.key,field,row.value?.[field]);if(value)result[row.key][field]=value;}catch{}}}return result;}
