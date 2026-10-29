import {escapeHTML as esc} from './schema.js';
import {googleMapsURL} from '../map-links.js';
const groups=[['Identitas properti',['title_id','title_en','slug','property_type','purpose']],['Lokasi',['location_id','address_public','maps_url']],['Harga & kepemilikan',['price','currency','price_period','tenure']],['Detail & fasilitas',['bedrooms','bathrooms','land_area_m2','building_area_m2','description_id','description_en','facilities']],['Tayang & ketersediaan',['publication_status','availability','is_featured']]];
const facilities=['WiFi','Kolam renang','AC','Parkir','Dapur','Furnitur','Pemanas air'];
export function propertyFields(fields,row,fieldHTML){return groups.map(([label,keys],index)=>`<details class="property-group" ${index===0?'open':''}><summary>${label}</summary><div class="form-grid">${keys.map(key=>fieldHTML(fields.find(f=>f.key===key),row)).join('')}</div>${index===1?'<p class="help" id="property-map-help">Buka titik properti di Google Maps → Bagikan → Salin link, lalu tempel di atas. Kosongkan untuk menyembunyikan tombol lokasi.</p><a id="property-map-preview" class="outline" target="_blank" rel="noopener noreferrer" hidden>Cek titik di Google Maps ↗</a><p id="property-map-error" class="error" role="status"></p>':''}${index===2?'<p id="price-preview" class="help" role="status"></p>':''}${index===3?`<div class="facility-shortcuts" aria-label="Tambahkan fasilitas">${facilities.map(value=>`<button type="button" class="outline" data-facility="${esc(value)}" aria-pressed="false">${value}</button>`).join('')}</div><p class="muted">Ketuk fasilitas untuk menambah/menghapus, atau tulis fasilitas lainnya satu per baris.</p>`:''}${index===4?'<p class="help">Status tayang mengatur apakah properti tampil di website. Ketersediaan menginformasikan apakah properti masih bisa dipesan.</p>':''}</details>`).join('');}
export function enhancePropertyForm(form){
 const mapsInput=form.querySelector('[name=maps_url]'),mapsPreview=form.querySelector('#property-map-preview'),mapsError=form.querySelector('#property-map-error');
 mapsInput.setAttribute('aria-describedby','property-map-help property-map-error');
 function maps(){
  const raw=mapsInput.value.trim(),url=googleMapsURL(raw),invalid=!!raw&&!url;
  mapsInput.setCustomValidity?.(invalid?'Tempel link Bagikan dari Google Maps yang lengkap (https://).':'');
  mapsInput.setAttribute('aria-invalid',String(invalid));
  mapsPreview.hidden=!url;
  if(url)mapsPreview.href=url;else mapsPreview.removeAttribute('href');
  mapsError.textContent=invalid?'Link belum valid. Gunakan Google Maps → Bagikan → Salin link.':'';
 }
 mapsInput.addEventListener('input',maps);maps();
 form.querySelectorAll('input,select,textarea').forEach(control=>control.addEventListener('invalid',()=>{const details=control.closest('details');if(details)details.open=true;}));
 const input=form.querySelector('[name=facilities]');
 const values=()=>input.value.split('\n').map(x=>x.trim()).filter(Boolean);
 function sync(){form.querySelectorAll('[data-facility]').forEach(button=>button.setAttribute('aria-pressed',String(values().some(x=>x.toLowerCase()===button.dataset.facility.toLowerCase()))));}
 form.querySelectorAll('[data-facility]').forEach(button=>button.onclick=()=>{const key=button.dataset.facility,list=values(),has=list.some(x=>x.toLowerCase()===key.toLowerCase());input.value=(has?list.filter(x=>x.toLowerCase()!==key.toLowerCase()):[...list,key]).join('\n');sync();input.dispatchEvent(new input.ownerDocument.defaultView.Event('input',{bubbles:true}));});input.addEventListener('input',sync);sync();
 const preview=form.querySelector('#price-preview');
 function price(){const raw=form.querySelector('[name=price]').value,value=Number(raw),currency=form.querySelector('[name=currency]').value,period=form.querySelector('[name=price_period]').value;preview.textContent=raw===''?'Harga belum diisi: pengunjung akan diminta mengonfirmasi ke tim.':!Number.isFinite(value)||value<0?'Periksa harga: gunakan angka nol atau lebih.':new Intl.NumberFormat('id-ID',{style:'currency',currency:currency||'IDR',maximumFractionDigits:currency==='USD'?2:0}).format(value)+({total:' · total',night:' / malam',day:' / hari',month:' / bulan',year:' / tahun'}[period]||'');}
 for(const name of ['price','currency','price_period'])form.querySelector('[name='+name+']').addEventListener('input',price);price();
}
