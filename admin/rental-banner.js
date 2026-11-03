import {loadGallery} from './gallery.js';
export async function loadRentalBanner(container,{request,authorize,onNotice,isCurrent=()=>true,onBusy=()=>{}}){
 container.innerHTML='<div class="page-heading"><div><p class="eyebrow">Konten website</p><h1>Foto utama rental</h1><p class="muted">Ganti gambar besar halaman rental motor dan kartu rental di beranda.</p></div></div><section class="editor rental-banner-editor"><h2>Gambar rental motor</h2><p class="help">Pilih foto mendatar agar tampil baik di desktop dan ponsel. Foto langsung disimpan setelah upload berhasil; file foto lama dibersihkan otomatis.</p><div class="media" id="rental-banner-gallery"></div><label class="upload-label">Unggah foto utama<small>JPG, PNG, atau WebP · maksimal 8 MB. Jika sudah ada foto, gunakan Ganti foto pada gambar.</small><input id="rental-banner-upload" type="file" accept="image/jpeg,image/png,image/webp"></label><p id="rental-banner-error" class="error" role="alert"></p><a class="outline" href="/motor-rental" target="_blank" rel="noopener noreferrer">Lihat halaman rental ↗</a></section>';
 const gallery=container.querySelector('#rental-banner-gallery'),input=container.querySelector('#rental-banner-upload');
 const current=()=>container.isConnected&&isCurrent();
 const busy=value=>{if(!current())return;input.disabled=value;onBusy(value);};
 const refresh=()=>loadGallery(gallery,{table:'site_media',id:'rental_hero',request,onNotice,isCurrent,onBusy:busy});
 await refresh();if(!current())return;
 input.onchange=async()=>{
  const file=input.files?.[0];if(!file)return;const error=container.querySelector('#rental-banner-error');error.textContent='';
  if(file.size>8*1024*1024){input.value='';error.textContent='Foto terlalu besar. Maksimal 8 MB per foto.';return;}
  busy(true);
  try{
   await authorize();if(!current())return;
   const data=new FormData();data.set('table','site_media');data.set('id','rental_hero');data.set('file',file);
   const result=await request(data);await refresh();if(current())onNotice(result.warning||'Foto utama rental tersimpan.',!!result.warning);
  }catch(e){if(current())error.textContent=e.message||'Foto belum berhasil diunggah.';}
  finally{if(current()){input.value='';busy(false);}}
 };
}

export async function loadRentalPosters(container,{request,authorize,onNotice,isCurrent=()=>true,onBusy=()=>{}}){
 const slots=[{key:'tour_poster',title:'Paket Tour'},{key:'driver_poster',title:'Layanan Sopir'}];
 container.innerHTML='<div class="page-heading"><div><p class="eyebrow">Konten website</p><h1>Poster tour & sopir</h1><p class="muted">Ganti poster yang tampil di bagian rental pada beranda dan halaman rental motor.</p></div></div><p class="help">Gunakan ukuran 1080 × 1350 px (rasio 4:5) untuk kedua poster. Masukkan harga, rute, kontak, dan detail layanan langsung ke desain. Poster ditampilkan utuh. Upload langsung menayangkan gambar; gunakan Ganti foto untuk memperbarui poster.</p><div class="rental-poster-editors">'+slots.map(slot=>`<section class="editor rental-poster-editor"><h2>${slot.title}</h2><div class="media" id="poster-${slot.key}-gallery"></div><label class="upload-label" id="poster-${slot.key}-label">Unggah poster ${slot.title}<small>1080 × 1350 px · JPG, PNG, atau WebP · maksimal 8 MB</small><input id="poster-${slot.key}-upload" type="file" accept="image/jpeg,image/png,image/webp"></label><p class="error" role="alert" id="poster-${slot.key}-error"></p></section>`).join('')+'</div><a class="outline" href="/motor-rental#rentalPosters" target="_blank" rel="noopener noreferrer">Lihat poster di website ↗</a>';
 const current=()=>container.isConnected&&isCurrent();let working=false;
 const busy=value=>{if(!current())return;working=value;container.querySelectorAll('input,button').forEach(control=>control.disabled=value);onBusy(value);};
 for(const slot of slots){
  const gallery=container.querySelector(`#poster-${slot.key}-gallery`),input=container.querySelector(`#poster-${slot.key}-upload`),label=container.querySelector(`#poster-${slot.key}-label`),error=container.querySelector(`#poster-${slot.key}-error`);
  // Gallery removals need to restore the upload control as well.
  const requestWithRefresh=async data=>{const result=await request(data);if(current()&&!(data instanceof FormData)&&data.action==='list'&&data.id===slot.key)label.hidden=result.images.length>0;return result;};
  await loadGallery(gallery,{table:'site_media',id:slot.key,request:requestWithRefresh,onNotice,isCurrent,onBusy:busy});
  if(!current())return;
  input.onchange=async()=>{
   const file=input.files?.[0];if(!file||working)return;error.textContent='';
   if(file.size>8*1024*1024){input.value='';error.textContent='Poster terlalu besar. Maksimal 8 MB.';return;}
   busy(true);
   try{await authorize();if(!current())return;const data=new FormData();data.set('table','site_media');data.set('id',slot.key);data.set('file',file);const result=await request(data);await loadGallery(gallery,{table:'site_media',id:slot.key,request:requestWithRefresh,onNotice,isCurrent,onBusy:busy});if(current())onNotice(result.warning||'Poster '+slot.title+' tersimpan dan ditayangkan.',!!result.warning);}
   catch(e){if(current())error.textContent=e.message||'Poster belum berhasil diunggah.';}
   finally{if(current()){input.value='';busy(false);}}
  };
 }
}
