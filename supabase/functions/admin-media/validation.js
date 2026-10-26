const MAX_DIMENSION=12000,MAX_PIXELS=40000000;
const dimensions=(w,h)=>w>0&&h>0&&w<=MAX_DIMENSION&&h<=MAX_DIMENSION&&w*h<=MAX_PIXELS;
// Inspect container boundaries and dimensions without decoding untrusted pixels.
// This is not a complete image decoder or malware scanner.
export function imageType(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<12)return null;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const text=(at,n)=>String.fromCharCode(...bytes.subarray(at,at+n));
 if(bytes.subarray(0,8).join(',')==='137,80,78,71,13,10,26,10'){
  if(bytes.length<57||view.getUint32(8)!==13||text(12,4)!=='IHDR'||!dimensions(view.getUint32(16),view.getUint32(20)))return null;
  let at=8,image=false;
  while(at+12<=bytes.length){
   const size=view.getUint32(at),type=text(at+4,4),end=at+12+size;
   if(end>bytes.length||type==='acTL'||type==='fcTL'||type==='fdAT'||(at!==8&&type==='IHDR'))return null;
   if(type==='IDAT'&&size>0)image=true;
   if(type==='IEND')return size===0&&image&&end===bytes.length?['image/png','png']:null;
   at=end;
  }
  return null;
 }
 if(bytes[0]===255&&bytes[1]===216){
  if(bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)return null;
  let at=2,frame=false;
  while(at+4<=bytes.length){
   if(bytes[at++]!==255)return null;while(bytes[at]===255)at++;
   const marker=bytes[at++];if(marker===0||marker===216||marker===217||at+2>bytes.length)return null;
   const size=view.getUint16(at);if(size<2||at+size>bytes.length)return null;
   if([192,193,194].includes(marker)){
    if(frame||size<11||size!==8+3*bytes[at+7]||bytes[at+2]!==8||!dimensions(view.getUint16(at+5),view.getUint16(at+3)))return null;
    frame=true;
   }
   if(marker===218)return frame&&at+size<bytes.length-2?['image/jpeg','jpg']:null;
   at+=size;
  }
  return null;
 }
 if(text(0,4)==='RIFF'&&text(8,4)==='WEBP'){
  if(view.getUint32(4,true)+8!==bytes.length)return null;
  let at=12,canvas,image;
  while(at+8<=bytes.length){
   const type=text(at,4),size=view.getUint32(at+4,true),start=at+8,end=start+size;
   if(end+(size%2)>bytes.length||type==='ANIM'||type==='ANMF')return null;
   let w,h;
   if(type==='VP8X'){
    if(at!==12||size!==10||(bytes[start]&2))return null;
    const u24=i=>bytes[i]+bytes[i+1]*256+bytes[i+2]*65536;
    canvas=[u24(start+4)+1,u24(start+7)+1];if(!dimensions(...canvas))return null;
   }else if(type==='VP8 '){
    if(size<10||(bytes[start]&1)||text(start+3,3)!=='\x9d\x01\x2a')return null;
    w=view.getUint16(start+6,true)&16383;h=view.getUint16(start+8,true)&16383;
   }else if(type==='VP8L'){
    if(size<5||bytes[start]!==47)return null;
    const bits=view.getUint32(start+1,true);if(bits>>>29)return null;
    w=(bits&16383)+1;h=((bits>>>14)&16383)+1;
   }
   if(w!==undefined){if(image||!dimensions(w,h))return null;image=[w,h];}
   at=end+(size%2);
  }
  return at===bytes.length&&image&&(!canvas||(canvas[0]===image[0]&&canvas[1]===image[1]))?['image/webp','webp']:null;
 }
 return null;
}
export const staffRole=user=>!!user?.id&&['owner','admin','editor','developer'].includes(user.app_metadata?.aup_role);
export const validUUID=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export const mediaTables={properties:['property_images','property_id'],motorbikes:['motorbike_images','motorbike_id'],guest_moments:['guest_moments',null]};
export const validMediaPath=(table,path,parentId)=>Object.hasOwn(mediaTables,table)&&typeof path==='string'&&new RegExp('^'+table+'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)$','i').test(path)&&(table==='guest_moments'||!parentId||path.startsWith(table+'/'+parentId+'/'));
export async function boundedBody(req,limit){
 const reader=req.body?.getReader();if(!reader)return new Uint8Array();
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Error('BODY_TOO_LARGE');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}

