import {escapeHTML as esc} from './schema.js';
export async function loadGallery(container,{table,id,request,onNotice,isCurrent=()=>true,onBusy=()=>{},onReplace=()=>{}}){
 let images=[],busy=false;
 const current=()=>container.isConnected&&isCurrent();
 function render(error=''){
  if(!current())return;
  container.innerHTML=`${error?`<p class="error" role="alert">${esc(error)}</p>`:''}${images.length?images.map((image,index)=>`<figure class="gallery-photo"><img src="${esc(image.url)}" alt="Foto ${index+1}" loading="lazy" decoding="async"><figcaption>${table==='site_media'?'Foto utama rental':image.is_cover?'Foto utama':'Foto '+(index+1)}</figcaption><div class="gallery-actions">${!['guest_moments','site_media'].includes(table)?`<button type="button" class="${image.is_cover?'secondary':'outline'}" data-cover="${esc(image.id)}" ${busy||image.is_cover?'disabled':''}>${image.is_cover?'✓ Utama':'Jadikan utama'}</button><div class="gallery-move"><button type="button" class="secondary" data-move="${index}" data-direction="-1" aria-label="Majukan foto ${index+1}" ${busy||index===0?'disabled':''}>←</button><button type="button" class="secondary" data-move="${index}" data-direction="1" aria-label="Mundurkan foto ${index+1}" ${busy||index===images.length-1?'disabled':''}>→</button></div>`:''}<label class="gallery-replace">Ganti foto<input data-replace="${index}" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Ganti foto ${index+1}" ${busy?'disabled':''}></label>${table!=='guest_moments'?`<button type="button" class="outline gallery-remove" data-remove="${esc(image.id)}" ${busy?'disabled':''}>${table==='site_media'?'Gunakan gambar bawaan':'Hapus'}</button>`:''}</div></figure>`).join(''):`<p class="muted">${error?'':table==='site_media'?'Saat ini memakai gambar bawaan. Unggah foto pilihan untuk menggantinya.':'Belum ada foto. Tambahkan foto pertama untuk menjadi foto utama.'}</p>`}<p class="gallery-status muted" role="status">${busy?'Menyimpan perubahan foto…':''}</p>`;
  container.querySelectorAll('[data-cover]').forEach(button=>button.onclick=()=>mutate({action:'cover',image_id:button.dataset.cover},'Foto utama diperbarui.'));
  container.querySelectorAll('[data-move]').forEach(button=>button.onclick=()=>{const order=images.map(x=>x.id),from=Number(button.dataset.move),to=from+Number(button.dataset.direction);[order[from],order[to]]=[order[to],order[from]];return mutate({action:'reorder',order},'Urutan foto diperbarui.');});
  container.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{if(confirm(table==='site_media'?'Kembali ke gambar bawaan dan hapus file foto pilihan ini?':'Hapus foto ini beserta file aslinya? Foto utama berikutnya akan dipilih otomatis bila diperlukan.'))return mutate({action:'remove',image_id:button.dataset.remove,expected_path:images.find(image=>image.id===button.dataset.remove)?.storage_path},'Foto dihapus.');});
  container.querySelectorAll('[data-replace]').forEach(input=>input.onchange=()=>{
   const file=input.files?.[0];if(!file)return;
   if(file.size>8*1024*1024){input.value='';onNotice('Foto terlalu besar. Maksimal 8 MB per foto.',true);return;}
   if(!confirm(table==='guest_moments'?'Ganti foto dan hapus file lama? Foto baru menjadi draft dan perlu izin publikasi kembali.':'Ganti foto ini dan hapus file lama setelah berhasil?')){input.value='';return;}
   const image=images[Number(input.dataset.replace)],data=new FormData();
   for(const [key,value]of Object.entries({table,id,action:'replace',image_id:image.id,expected_path:image.storage_path}))data.set(key,value);
   data.set('file',file);return mutate(data,table==='guest_moments'?'Foto diganti. Periksa izin publikasi dan terbitkan kembali.':'Foto berhasil diganti.',true);
  });
 }
 async function refresh(){const data=await request({action:'list',table,id});if(!current())return;images=data.images;render();}
 async function mutate(payload,message,replacing=false){if(busy||!current())return;busy=true;onBusy(true);render();try{const result=await request(payload instanceof FormData?payload:{...payload,table,id});if(current()&&replacing)onReplace(result.record);await refresh();if(current())onNotice(result.warning||message,!!result.warning);}catch(error){render(error.message||'Foto belum bisa diperbarui.');}finally{busy=false;if(current())onBusy(false);render(container.querySelector('[role=alert]')?.textContent||'');}}
 container.classList.add('gallery');
 try{await refresh();}catch(error){render(error.message||'Foto belum bisa dimuat.');if(current()){const retry=document.createElement('button');retry.type='button';retry.className='secondary';retry.textContent='Muat ulang foto';retry.onclick=()=>loadGallery(container,{table,id,request,onNotice,isCurrent,onBusy,onReplace});container.append(retry);}}
}
