import {escapeHTML as esc} from './schema.js';

export const navigationGroups=[
 {label:'Aktivitas harian',items:['dashboard','inquiries','invoices']},
 {label:'Katalog',items:['properties','motorbikes','locations','services']},
 {label:'Konten website',items:['guest_moments','testimonials']},
 {label:'Pengaturan',items:['site_settings','staff_access','activity_log','developer_access']}
];
const hints={
 dashboard:'Lihat pekerjaan dan informasi penting hari ini.',
 inquiries:'Baca permintaan pelanggan, catat tindak lanjut, dan perbarui status tiket.',
 invoices:'Kelola tagihan dan periksa status pembayaran pelanggan.',
 properties:'Kelola informasi, harga, foto, dan ketersediaan properti atau kos.',
 motorbikes:'Atur unit motor, tarif rental, perlengkapan, dan ketersediaannya.',
 locations:'Rapikan lokasi yang digunakan pada listing properti.',
 services:'Kelola deskripsi dan status tayang layanan properti.',
 guest_moments:'Kelola foto tamu beserta keterangan dan izin publikasinya.',
 testimonials:'Kelola ulasan pelanggan dan izin untuk menampilkannya.',
 site_settings:'Perbarui kontak bisnis dan tautan media sosial website.',
 staff_access:'Kelola akun dan peran anggota tim.',
 activity_log:'Lihat riwayat aktivitas akun pengelola.',
 developer_access:'Kelola izin akses developer sesuai kebutuhan.'
};
const paths={
 dashboard:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
 inquiries:'M4 5h16v14H4zM8 9h8M8 13h5',
 invoices:'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5',
 properties:'m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7',
 motorbikes:'M5 16a3 3 0 1 0 0 .1M19 16a3 3 0 1 0 0 .1M5 16l4-8h5l5 8M9 8l5 8H5M14 8l-1-4h3',
 locations:'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0ZM9 10a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
 services:'M4 8h16v12H4zM8 8V4h8v4M4 13h16M10 13v3h4v-3',
 guest_moments:'M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M15 8h.01',
 testimonials:'M4 4h16v12H8l-4 4zM8 8h8M8 12h5',
 site_settings:'M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4',
 staff_access:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a6 6 0 0 1 12 0v2M17 4a4 4 0 0 1 0 8M22 21v-2a6 6 0 0 0-5-5',
 activity_log:'M12 8v5l3 2M4 7V3M4 7h4M4 7a9 9 0 1 1-1 8',
 developer_access:'m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16'
};
export const sectionHint=id=>hints[id]||'Kelola data pada bagian ini.';
export const sectionGroup=id=>navigationGroups.find(group=>group.items.includes(id))?.label||'Menu lainnya';
export function panelIcon(id){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${paths[id]||paths.dashboard}"/></svg>`;}
export function permittedGroups(sections,allowed){
 const groups=navigationGroups.map(group=>({...group,items:group.items.filter(id=>sections[id]&&allowed(sections[id]))})).filter(group=>group.items.length);
 const known=new Set(navigationGroups.flatMap(group=>group.items));
 const other=Object.keys(sections).filter(id=>!known.has(id)&&allowed(sections[id]));
 return other.length?[...groups,{label:'Menu lainnya',items:other}]:groups;
}
export function navigationHTML(sections,allowed,current){
 return permittedGroups(sections,allowed).map(group=>`<div class="panel-nav-group"><p class="panel-nav-heading">${esc(group.label)}</p>${group.items.map(id=>`<button type="button" data-section="${esc(id)}" aria-current="${id===current?'page':'false'}" title="${esc(sectionHint(id))}">${panelIcon(id)}<span>${esc(sections[id].label)}</span></button>`).join('')}</div>`).join('');
}
export function bindPanelMenu({button,closeButton,sidebar,backdrop,workspace,body,media}){
 if(!button||!sidebar||!backdrop||!workspace)return {close(){},dispose(){}};
 let opened=false;
 function close(restore=true){
  const wasOpen=opened;opened=false;body.classList.remove('panel-menu-open');backdrop.hidden=true;workspace.inert=false;
  button.setAttribute('aria-expanded','false');sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');
  if(wasOpen&&restore)button.focus?.({preventScroll:true});
 }
 function open(){
  if(media&&!media.matches)return;
  opened=true;body.classList.add('panel-menu-open');backdrop.hidden=false;workspace.inert=true;
  button.setAttribute('aria-expanded','true');sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');
  (sidebar.querySelector('[aria-current="page"]')||closeButton)?.focus?.();
 }
 button.onclick=()=>opened?close():open();
 if(closeButton)closeButton.onclick=()=>close();
 backdrop.onclick=()=>close();
 const keys=event=>{
  if(!opened)return;
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.key!=='Tab')return;
  const items=[...sidebar.querySelectorAll('a[href],button:not([disabled])')].filter(el=>!el.hidden);
  const first=items[0],last=items.at(-1),active=sidebar.ownerDocument.activeElement;
  if(event.shiftKey&&active===first){event.preventDefault();last?.focus?.();}
  else if(!event.shiftKey&&active===last){event.preventDefault();first?.focus?.();}
 };
 sidebar.addEventListener('keydown',keys);
 const changed=()=>{if(!media.matches)close(false);};
 media?.addEventListener?.('change',changed);
 return {close,dispose(){close(false);sidebar.removeEventListener('keydown',keys);media?.removeEventListener?.('change',changed);}};
}
