import {escapeHTML as esc} from './schema.js';
export const ticketSelect='*,properties(title_id,title_en,slug),motorbikes(name,slug),services(title_id,title_en)';
export const statusHelp={new:'Permintaan baru. Periksa detail dan hubungi pelanggan.',contacted:'Pelanggan sudah dihubungi. Catat hasil komunikasi dan langkah berikutnya.',in_progress:'Permintaan sedang ditangani. Catat perkembangan dan jadwal tindak lanjut.',closed:'Permintaan selesai ditangani. Catat hasil akhirnya sebelum menyimpan.',spam:'Permintaan ditandai sebagai spam. Catatan tetap disimpan untuk pengelola.'};
export function contactLinks(row){
 const raw=String(row.phone||'').trim();let phone='';
 if(/^[+\d\s().-]+$/.test(raw)){phone=raw.replace(/\D/g,'');if(phone.startsWith('0'))phone='62'+phone.slice(1);if(phone.length<7||phone.length>15)phone='';}
 const email=String(row.email||'').trim();const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&!/[\r\n]/.test(email);
 const greeting=row.language==='id'?`Halo ${row.name||''}, kami dari Agung Ubud Property ingin menindaklanjuti tiket ${row.ticket_no}.`:`Hello ${row.name||''}, we are from Agung Ubud Property, following up on ticket ${row.ticket_no}.`;
 return `<div class="ticket-actions" aria-label="Kontak pelanggan">${phone?`<a class="button outline" href="https://wa.me/${phone}?text=${esc(encodeURIComponent(greeting))}" target="_blank" rel="noopener noreferrer">Buka WhatsApp</a><a class="button outline" href="tel:+${phone}">Telepon</a>`:''}${validEmail?`<a class="button outline" href="mailto:${esc(encodeURIComponent(email))}?subject=${esc(encodeURIComponent('Agung Ubud Property · '+row.ticket_no))}">Email</a>`:''}<button type="button" class="secondary" id="copy-ticket">Salin nomor tiket</button></div><p class="help">WhatsApp dan email membuka aplikasi untuk menghubungi pelanggan. Status tiket diperbarui setelah komunikasi dilakukan. Catatan internal hanya untuk pengelola.</p>`;
}
export async function readTicket(db,id){const result=await db.from('inquiries').select(ticketSelect).eq('id',id).single();if(result.error)throw result.error;if(!result.data?.id)throw Error('Tiket tidak ditemukan atau akses sudah berubah.');return result.data;}
export async function saveTicket(db,row,payload){
 if(!row.updated_at)throw Error('Muat ulang tiket sebelum menyimpan.');
 const result=await db.from('inquiries').update({status:payload.status,internal_notes:payload.internal_notes}).eq('id',row.id).eq('updated_at',row.updated_at).select('id,status,internal_notes,updated_at');
 if(result.error)throw result.error;
 if(result.data?.length!==1){const error=Error('Tiket sudah berubah atau akses tidak tersedia. Catatanmu tetap di layar. Salin catatan yang ingin dipertahankan, lalu muat ulang tiket.');error.code='TICKET_CHANGED';throw error;}
 return result.data[0];
}
export function enhanceTicketForm(form,row,{onNotice,onReload}){
 const status=form.querySelector('[name=status]'),help=form.querySelector('#ticket-status-help');const update=()=>help.textContent=statusHelp[status.value]||'';status.addEventListener('change',update);update();
 form.querySelector('#reload-ticket').onclick=onReload;
 form.querySelector('#copy-ticket').onclick=async()=>{try{await navigator.clipboard.writeText(row.ticket_no);onNotice('Nomor tiket disalin.');}catch{onNotice('Belum bisa menyalin. Pilih nomor tiket di kolom lalu salin manual.',true);}};
}
