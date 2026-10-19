export const REMEMBER_DURATION=7*24*60*60*1000;

// MFA and staff access are still checked by the server. This adapter only
// retains an already verified session; it never stores a password or TOTP key.
export function createPortalStorage({storageKey,session,persistent,now=()=>Date.now()}){
 const pendingKey=storageKey+':remember',deadlineKey=storageKey+':deadline',memory=new Map();
 const getStore=source=>{try{return typeof source==='function'?source():source;}catch{return null;}};
 const read=(source,key)=>{try{return getStore(source)?.getItem(key)??null;}catch{return null;}};
 const remove=(source,key)=>{try{getStore(source)?.removeItem(key);}catch{}};
 const write=(source,key,value)=>{try{const target=getStore(source);if(!target)return false;target.setItem(key,value);return target.getItem(key)===value;}catch{return false;}};
 const tabRead=key=>read(session,key)??memory.get(key)??null;
 const tabWrite=(key,value)=>{if(write(session,key,value))memory.delete(key);else memory.set(key,value);};
 const tabRemove=key=>{remove(session,key);memory.delete(key);};
 function retained(){
  const raw=read(persistent,storageKey);if(!raw)return null;
  try{
   const item=JSON.parse(raw);
   if(item.version===1&&typeof item.value==='string'&&Number.isFinite(item.expiresAt)&&item.expiresAt>now()&&item.expiresAt<=now()+REMEMBER_DURATION)return item;
  }catch{}
  remove(persistent,storageKey);return null;
 }
 function clear(){tabRemove(storageKey);tabRemove(pendingKey);tabRemove(deadlineKey);remove(persistent,storageKey);}
 const storage={
  getItem(key){return key===storageKey?(tabRead(key)??retained()?.value??null):tabRead(key);},
  setItem(key,value){
   if(key!==storageKey){tabWrite(key,value);return;}
   const item=retained();
   if(item&&write(persistent,key,JSON.stringify({...item,value}))){tabRemove(key);return;}
   remove(persistent,key);tabWrite(key,value);
  },
  removeItem(key){if(key===storageKey)clear();else tabRemove(key);}
 };
 return {
  storage,
  prepare(remember){clear();if(remember)tabWrite(pendingKey,'1');},
  suspend(){const old=retained();if(old){tabWrite(storageKey,old.value);tabWrite(pendingKey,'1');tabWrite(deadlineKey,String(old.expiresAt));remove(persistent,storageKey);}},
  confirm(){
   const old=retained(),requested=tabRead(pendingKey)==='1';
   if(old)return {requested:true,remembered:true,expiresAt:old.expiresAt};
   const value=tabRead(storageKey),expiresAt=Number(tabRead(deadlineKey))||now()+REMEMBER_DURATION;
   if(requested&&value&&expiresAt>now()&&write(persistent,storageKey,JSON.stringify({version:1,value,expiresAt}))){tabRemove(storageKey);tabRemove(pendingKey);tabRemove(deadlineKey);return {requested:true,remembered:true,expiresAt};}
   tabRemove(pendingKey);return {requested,remembered:false,expiresAt:0};
  },
  clear
 };
}
