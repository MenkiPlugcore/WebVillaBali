import {escapeHTML as esc} from './schema.js';
export async function loadGallery(container,{table,id,request,onNotice,isCurrent=()=>true}){
 let images=[],busy=false;
 const current=()=>container.isConnected&&isCurrent();
 function render(error=''){
  if(!current())return;
  container.innerHTML=`${error?`<p class="error" role="alert">${esc(error)}</p>`:''}${images.length?images.map((image,index)=>`<figure class="gallery-photo"><img src="${esc(image.url)}" alt="Foto ${index+1}" loading="lazy"><figcaption>${image.is_cover?'Foto utama':'Foto '+(index+1)}</figcaption>${table!=='guest_moments'?`<div class="gallery-actions"><button type="button" class="${image.is_cover?'secondary':'outline'}" data-cover="${esc(image.id)}" ${busy||image.is_cover?'disabled':''}>${image.is_cover?'✓ Utama':'Jadikan utama'}</button><div class="gallery-move"><button type="button" class="secondary" data-move="${index}" data-direction="-1" aria-label="Majukan foto ${index+1}" ${busy||index===0?'disabled':''}>←</button><button type="button" class="secondary" data-move="${index}" data-direction="1" aria-label="Mundurkan foto ${index+1}" ${busy||index===images.length-1?'disabled':''}>→</button></div><button type="button" class="outline gallery-remove" data-remove="${esc(image.id)}" ${busy?'disabled':''}>Hapus</button></div>`:''}</figure>`).join(''):`<p class="muted">${error?'':'Belum ada foto. Tambahkan foto pertama untuk menjadi foto utama.'}</p>`}<p class="gallery-status muted" role="status">${busy?'Menyimpan perubahan foto…':''}</p>`;
  container.querySelectorAll('[data-cover]').forEach(button=>button.onclick=()=>mutate({action:'cover',image_id:button.dataset.cover},'Foto utama diperbarui.'));
  container.querySelectorAll('[data-move]').forEach(button=>button.onclick=()=>{const order=images.map(x=>x.id),from=Number(button.dataset.move),to=from+Number(button.dataset.direction);[order[from],order[to]]=[order[to],order[from]];return mutate({action:'reorder',order},'Urutan foto diperbarui.');});
  container.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{if(confirm('Hapus foto ini? Foto utama berikutnya akan dipilih otomatis bila diperlukan.'))return mutate({action:'remove',image_id:button.dataset.remove},'Foto dihapus.');});
 }
 async function refresh(){const data=await request({action:'list',table,id});if(!current())return;images=data.images;render();}
 async function mutate(payload,message){if(busy||!current())return;busy=true;render();try{const result=await request({...payload,table,id});await refresh();onNotice(result.warning||message,!!result.warning);}catch(error){render(error.message||'Foto belum bisa diperbarui.');}finally{busy=false;render(container.querySelector('[role=alert]')?.textContent||'');}}
 container.classList.add('gallery');
 try{await refresh();}catch(error){render(error.message||'Foto belum bisa dimuat.');if(current()){const retry=document.createElement('button');retry.type='button';retry.className='secondary';retry.textContent='Muat ulang foto';retry.onclick=()=>loadGallery(container,{table,id,request,onNotice,isCurrent});container.append(retry);}}
}
