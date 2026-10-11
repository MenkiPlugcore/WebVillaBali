import {escapeHTML as esc} from './schema.js';
const checked=async result=>{if(result.error)throw result.error;return result.data;};
export class MFARequired extends Error {}
export async function requireMFA(auth){
 const level=await checked(await auth.mfa.getAuthenticatorAssuranceLevel());
 if(level.currentLevel!=='aal2'||level.nextLevel!=='aal2')throw new MFARequired('Verifikasi dua langkah diperlukan.');
}
// Secrets only exist in this screen's memory, never local storage or application tables.
export async function showMFA(app,auth,{onVerified,onExit,onError}){
 const factors=await checked(await auth.mfa.listFactors());
 const verified=(factors.totp||[]).filter(f=>f.status==='verified');
 let factorId=verified[0]?.id,busy=false;
 app.innerHTML=`<section class="login mfa"><p class="eyebrow">KEAMANAN ADMIN</p><h1>${verified.length?'Verifikasi dua langkah':'Aktifkan authenticator'}</h1><p>${verified.length?'Masukkan kode 6 digit dari aplikasi authenticator kamu.':'Tambahkan akun ini ke aplikasi authenticator. Di HP yang sama, kamu bisa menyalin kunci pemasangan secara manual.'}</p>${verified.length?`<div class="field"><label for="mfa-factor">Authenticator</label><select id="mfa-factor">${verified.map(f=>`<option value="${esc(f.id)}">${esc(f.friendly_name||'Authenticator')}</option>`).join('')}</select></div>`:'<button id="mfa-start" type="button">Siapkan authenticator</button><div id="mfa-setup"></div>'}<form id="mfa-form" ${verified.length?'':'hidden'}><div class="field"><label for="mfa-code">Kode authenticator</label><input id="mfa-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div><button type="submit">Verifikasi dan masuk</button></form><p id="mfa-error" class="error" role="alert"></p><p class="help">Simpan cadangan authenticator di tempat aman. Jangan kirim kunci pemasangan atau kode ke siapa pun. Jika HP hilang, hubungi pemilik akun Supabase untuk pemulihan setelah identitas diverifikasi.</p><button id="mfa-exit" class="secondary" type="button">Keluar</button></section>`;
 const errorEl=app.querySelector('#mfa-error'),form=app.querySelector('#mfa-form');
 const report=error=>errorEl.textContent=onError(error);
 app.querySelector('#mfa-factor')?.addEventListener('change',e=>factorId=e.target.value);
 app.querySelector('#mfa-exit').onclick=async()=>{if(busy)return;try{await onExit();}catch(e){report(e);}};
 const start=app.querySelector('#mfa-start');
 if(start)start.onclick=async()=>{if(busy)return;busy=true;start.disabled=true;errorEl.textContent='';try{
  // Clean up unfinished enrollment from a previous reload; verified factors are untouched.
  for(const f of factors.all||[])if(f.factor_type==='totp'&&f.status==='unverified')await checked(await auth.mfa.unenroll({factorId:f.id}));
  const enrollment=await checked(await auth.mfa.enroll({factorType:'totp',friendlyName:'Agung Ubud Admin',issuer:'Agung Ubud Property'}));
  factorId=enrollment.id;const setup=app.querySelector('#mfa-setup');
  setup.innerHTML='<p>Scan QR ini, atau masukkan kunci berikut di aplikasi authenticator.</p><img class="mfa-qr" alt="QR pemasangan authenticator"><details><summary>Pakai kunci manual di HP ini</summary><label for="mfa-secret">Kunci pemasangan</label><input id="mfa-secret" readonly autocomplete="off" spellcheck="false"><p>Tambahkan akun TOTP dengan kunci ini, lalu kembali ke panel dan isi kodenya.</p></details>';
  const qr=enrollment.totp.qr_code;setup.querySelector('img').src=qr.startsWith('data:image/')?qr:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(qr);
  setup.querySelector('#mfa-secret').value=enrollment.totp.secret;
  start.remove();form.hidden=false;
 }catch(e){report(e);start.disabled=false;}finally{busy=false;}};
 form.onsubmit=async e=>{e.preventDefault();if(busy)return;const code=form.querySelector('[name=code]').value.trim();if(!/^[0-9]{6}$/.test(code)){errorEl.textContent='Masukkan kode 6 digit.';return;}busy=true;const button=form.querySelector('[type=submit]');button.disabled=true;errorEl.textContent='';try{
  await checked(await auth.mfa.challengeAndVerify({factorId,code}));
  form.querySelector('[name=code]').value='';app.querySelector('#mfa-setup')?.replaceChildren();await onVerified();
 }catch(e){report(e);}finally{busy=false;button.disabled=false;}};
}
