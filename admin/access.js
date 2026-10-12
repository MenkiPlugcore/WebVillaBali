import {escapeHTML as esc} from './schema.js';
const checked=async result=>{if(result.error)throw result.error;return result.data;};
const stamp=value=>value?new Date(value).toLocaleString('id-ID'):'Tanpa batas waktu';
export async function loadDeveloperAccess(db,container,{isCurrent,onNotice,onError}){
 const entries=await checked(await db.rpc('manage_developer_access'));
 if(!isCurrent())return;
 container.innerHTML=`<section><p class="eyebrow">IZIN OWNER</p><h1>Akses developer</h1><p class="help">Developer membuka panel bisnis yang sama lewat akun dan MFA sendiri. Pencabutan langsung menghentikan akses data staf pada permintaan berikutnya. Pembuatan akun dan penetapan peran tetap dilakukan lewat pengelolaan pengguna Supabase.</p><div class="cards">${entries.length?entries.map(row=>`<article class="card"><h3>${esc(row.email)}</h3><p>${row.enabled?'Akses aktif':'Akses dicabut'} · ${esc(stamp(row.expires_at))}</p><button class="${row.enabled?'outline':'secondary'}" data-dev-user="${esc(row.user_id)}" data-enabled="${!row.enabled}">${row.enabled?'Cabut akses':'Aktifkan akses'}</button></article>`).join(''):'<p>Belum ada akun dengan peran developer.</p>'}</div><p id="access-error" class="error" role="alert"></p></section>`;
 container.querySelectorAll('[data-dev-user]').forEach(button=>button.onclick=async()=>{
  if(button.disabled)return;const enabled=button.dataset.enabled==='true';
  if(!confirm(enabled?'Aktifkan akses developer ini ke panel dan data bisnis?':'Cabut akses developer ini?'))return;
  button.disabled=true;try{await checked(await db.rpc('manage_developer_access',{p_user_id:button.dataset.devUser,p_enabled:enabled}));if(isCurrent()){onNotice(enabled?'Akses developer aktif.':'Akses developer dicabut.');await loadDeveloperAccess(db,container,{isCurrent,onNotice,onError});}}catch(error){if(isCurrent())container.querySelector('#access-error').textContent=onError(error);}finally{button.disabled=false;}
 });
}
export async function loadActivity(db,container,{isCurrent}){
 const entries=await checked(await db.from('staff_activity').select('id,actor_id,actor_role,table_name,record_key,action,created_at').order('created_at',{ascending:false}).limit(50));
 if(!isCurrent())return;
 container.innerHTML=`<section><p class="eyebrow">RIWAYAT PENGELOLAAN</p><h1>Aktivitas akun</h1><p class="help">50 perubahan terakhir yang boleh kamu lihat. Owner melihat semua akun; developer hanya melihat aktivitasnya sendiri. Pesan pelanggan, catatan internal, password, dan kode MFA tidak disalin ke riwayat ini.</p><div class="cards">${entries.length?entries.map(row=>`<article class="card"><p class="eyebrow">${esc(row.action)} · ${esc(row.table_name)}</p><p>${esc(row.record_key)}</p><small>${esc(stamp(row.created_at))} · ${esc(row.actor_role)}<br>Akun: ${esc(row.actor_id)}</small></article>`).join(''):'<p>Belum ada aktivitas tercatat.</p>'}</div></section>`;
}
