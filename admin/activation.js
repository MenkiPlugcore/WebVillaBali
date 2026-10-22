import {escapeHTML as esc} from './schema.js';
export function activationParams(hash){const p=new URLSearchParams(String(hash||'').replace(/^#/,''));const tokenHash=p.get('token_hash'),type=p.get('type');return /^[a-zA-Z0-9_-]{32,256}$/.test(tokenHash||'')&&['invite','recovery'].includes(type)?{tokenHash,type}:null;}
export async function mountActivation(container,auth,params){
 const invalid=()=>{container.innerHTML='<section class="login"><h1>Tautan tidak tersedia.</h1><p>Tautan aktivasi sudah dipakai, kedaluwarsa, atau tidak valid. Minta owner atau developer membuat tautan baru lewat Tim & akses.</p><a class="button" href="/admin/">Kembali ke login</a></section>';};
 if(!params){invalid();return;}
 let token=params.tokenHash;
 container.innerHTML='<section class="login"><p class="eyebrow">AKUN KARYAWAN</p><h1>Aktifkan akunmu.</h1><p>Buat password pribadi, lalu atur authenticator saat pertama masuk ke panel.</p><p id="activation-error" class="error" role="alert"></p><button id="activation-continue">Lanjutkan aktivasi</button></section>';
 container.querySelector('#activation-continue').onclick=async e=>{
  if(e.target.disabled||!token)return;e.target.disabled=true;
  try{
   const verified=await auth.verifyOtp({token_hash:token,type:params.type});token=null;if(verified.error)throw verified.error;
   const fresh=await auth.getUser();if(fresh.error)throw fresh.error;
   if(!['editor','admin'].includes(fresh.data?.user?.app_metadata?.aup_role))throw Error('Akun tidak memiliki akses karyawan. Hubungi owner.');
   const email=fresh.data.user.email;
   container.innerHTML=`<section class="login"><p class="eyebrow">AKUN KARYAWAN</p><h1>Buat password.</h1><p>Akun: <strong>${esc(email)}</strong></p><form id="activation-password"><div class="field"><label for="new-password">Password baru</label><input id="new-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required><p class="help">Gunakan minimal 12 karakter. Pilih password yang belum dipakai untuk akun lain.</p></div><div class="field"><label for="confirm-password">Ulangi password</label><input id="confirm-password" name="confirmation" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div><p id="activation-error" class="error" role="alert"></p><button type="submit">Simpan password</button></form></section>`;
   const form=container.querySelector('#activation-password');
   form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button');if(button.disabled)return;const password=form.querySelector('[name=password]').value,confirmation=form.querySelector('[name=confirmation]').value;const errorNode=container.querySelector('#activation-error');errorNode.textContent='';if(password.length<12||password.length>128){errorNode.textContent='Gunakan password sepanjang 12–128 karakter.';return;}if(password!==confirmation){errorNode.textContent='Kedua password belum sama.';return;}button.disabled=true;
    try{const result=await auth.updateUser({password});if(result.error)throw result.error;form.reset();try{await auth.signOut({scope:'local'});}catch{}container.innerHTML='<section class="login"><p class="eyebrow">PASSWORD TERSIMPAN</p><h1>Akun siap digunakan.</h1><p>Masuk dengan email dan password barumu, lalu ikuti pengaturan MFA untuk membuka panel.</p><a class="button" href="/admin/">Masuk ke panel</a></section>';}
    catch(error){errorNode.textContent=error.message||'Password belum berhasil disimpan. Coba lagi.';button.disabled=false;}
   };
  }catch(error){token=null;try{await auth.signOut({scope:'local'});}catch{}invalid();}
 };
}
