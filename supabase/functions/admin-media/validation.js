export function imageType(bytes){if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return ['image/jpeg','jpg'];if(bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10')return ['image/png','png'];if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')return ['image/webp','webp'];return null;}
export const staffRole=user=>!!user?.id&&['owner','admin','editor','developer'].includes(user.app_metadata?.aup_role);
export const validUUID=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export const mediaTables={properties:['property_images','property_id'],motorbikes:['motorbike_images','motorbike_id'],guest_moments:['guest_moments',null]};
export const validMediaPath=(table,path,parentId)=>Object.hasOwn(mediaTables,table)&&typeof path==='string'&&new RegExp('^'+table+'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)$','i').test(path)&&(!parentId||path.startsWith(table+'/'+parentId+'/'));
export async function boundedBody(req,limit){
 const reader=req.body?.getReader();if(!reader)return new Uint8Array();
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Error('BODY_TOO_LARGE');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}

