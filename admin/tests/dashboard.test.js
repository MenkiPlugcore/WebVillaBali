import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {loadDashboard} from '../dashboard.js';

test('late dashboard counts cannot overwrite a different section',async()=>{
 const {document}=parseHTML('<main id="content"></main>');
 const container=document.querySelector('main'),pending=[];
 let current=true;
 const db={from(){const query={select(field,options){assert.equal(field,'id');assert.deepEqual(options,{count:'exact',head:true});return this;},eq(){return this;},abortSignal(){return this;},then(resolve){pending.push(resolve);}};return query;}};
 const loaded=loadDashboard(db,{admin:true,container,isCurrent:()=>current,onOpen(){},onRefresh(){}});
 await Promise.resolve();
 assert.equal(pending.length,4);
 current=false;container.textContent='Tiket pelanggan';
 pending.forEach(resolve=>resolve({count:5,error:null}));
 await loaded;
 assert.equal(container.textContent,'Tiket pelanggan');
});
