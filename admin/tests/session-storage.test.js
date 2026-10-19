import test from 'node:test';import assert from 'node:assert/strict';
import {createPortalStorage,REMEMBER_DURATION} from '../session-storage.js';
const key='aup-admin-session';
function memory(){const values=new Map();return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
function fixture(){const session=memory(),persistent=memory();let clock=100000;return {session,persistent,now:()=>clock,advance:n=>clock+=n,open:(storageKey=key,tab=session)=>createPortalStorage({storageKey,session:tab,persistent,now:()=>clock})};}
test('ordinary sessions remain in the tab and opt-in alone never persists password-only sessions',()=>{
 const f=fixture(),a=f.open();a.prepare(false);a.storage.setItem(key,'tab-session');assert.equal(a.storage.getItem(key),'tab-session');assert.equal(f.persistent.values.size,0);assert.equal(f.open(key,memory()).storage.getItem(key),null);
 a.prepare(true);a.storage.setItem(key,'password-only');assert.equal(f.persistent.values.size,0);assert.equal(f.open().storage.getItem(key),'password-only');
});
test('only explicit confirmation after verification persists and restores a session in a new tab',()=>{
 const f=fixture(),a=f.open();a.prepare(true);a.storage.setItem(key,'verified-session');const saved=a.confirm();assert.equal(saved.remembered,true);assert.equal(saved.expiresAt,f.now()+REMEMBER_DURATION);assert.equal(f.session.getItem(key),null);assert.equal(f.open(key,memory()).storage.getItem(key),'verified-session');
});
test('refresh and repeated entry preserve the original deadline and expire without a sliding extension',()=>{
 const f=fixture(),a=f.open();a.prepare(true);a.storage.setItem(key,'initial');const expires=a.confirm().expiresAt;f.advance(60000);a.storage.setItem(key,'rotated');assert.equal(a.confirm().expiresAt,expires);assert.equal(f.open(key,memory()).storage.getItem(key),'rotated');f.advance(REMEMBER_DURATION);assert.equal(f.open(key,memory()).storage.getItem(key),null);assert.equal(f.persistent.getItem(key),null);
});
test('MFA re-verification demotes durable storage and preserves its deadline until verification succeeds',()=>{
 const f=fixture(),a=f.open();a.prepare(true);a.storage.setItem(key,'old-verified');const expires=a.confirm().expiresAt;f.advance(10000);a.suspend();assert.equal(f.persistent.getItem(key),null);assert.equal(a.storage.getItem(key),'old-verified');assert.equal(f.open(key,memory()).storage.getItem(key),null);a.storage.setItem(key,'new-verified');assert.equal(a.confirm().expiresAt,expires);
});
test('logout removes retained and pending values while owner/developer sessions stay isolated',()=>{
 const f=fixture(),owner=f.open(),dev=f.open('aup-dev-session');for(const [a,k]of [[owner,key],[dev,'aup-dev-session']]){a.prepare(true);a.storage.setItem(k,k);a.confirm();}dev.storage.removeItem('aup-dev-session');assert.equal(f.open().storage.getItem(key),key);assert.equal(dev.storage.getItem('aup-dev-session'),null);owner.storage.removeItem(key);assert.equal(f.persistent.values.size,0);assert.equal(f.session.values.size,0);
});
test('malformed, expired, or unbounded retained data is discarded before SDK restoration',()=>{
 for(const value of ['not-json',JSON.stringify({version:2,value:'x',expiresAt:200000}),JSON.stringify({version:1,value:{},expiresAt:200000}),JSON.stringify({version:1,value:'x',expiresAt:1}),JSON.stringify({version:1,value:'x',expiresAt:100000+REMEMBER_DURATION+1})]){const f=fixture();f.persistent.setItem(key,value);assert.equal(f.open().storage.getItem(key),null);assert.equal(f.persistent.getItem(key),null);}
});
test('blocked persistence and quota failures retain the active tab without claiming remembrance',()=>{
 const session=memory(),blocked={getItem(){throw Error('blocked');},setItem(){throw Error('quota');},removeItem(){throw Error('blocked');}};const a=createPortalStorage({storageKey:key,session,persistent:blocked});a.prepare(true);a.storage.setItem(key,'verified');assert.deepEqual(a.confirm(),{requested:true,remembered:false,expiresAt:0});assert.equal(a.storage.getItem(key),'verified');
 const b=createPortalStorage({storageKey:key,session:()=>{throw Error('disabled');},persistent:()=>{throw Error('disabled');}});b.prepare(false);b.storage.setItem(key,'memory-only');assert.equal(b.storage.getItem(key),'memory-only');b.storage.removeItem(key);assert.equal(b.storage.getItem(key),null);
});
