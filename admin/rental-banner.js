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
