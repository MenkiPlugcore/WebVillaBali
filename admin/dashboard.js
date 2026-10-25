import {escapeHTML as esc} from './schema.js';
import {panelIcon,sectionHint} from './navigation.js';
export function dashboardTasks(admin){return admin?[
 {section:'inquiries',label:'Tindak lanjuti pelanggan'},
 {section:'properties',label:'Perbarui properti & kos'},
 {section:'invoices',label:'Kelola invoice & pembayaran'},
 {section:'site_settings',label:'Ubah kontak & media sosial'}
]:[
 {section:'properties',label:'Perbarui properti & kos'},
 {section:'motorbikes',label:'Atur unit rental motor'},
 {section:'guest_moments',label:'Tambahkan momen tamu'},
 {section:'services',label:'Perbarui layanan'}
];}
export function dashboardCards(admin){
 const cards=[
  {id:'properties',label:'Properti terbit',table:'properties',filters:{publication_status:'published'},status:'published',hint:'Lihat properti yang tampil di website'},
  {id:'motorbikes',label:'Motor tersedia',table:'motorbikes',filters:{publication_status:'published',availability:'available'},status:'published',availability:'available',hint:'Lihat motor terbit yang tersedia'}
 ];
 if(admin)cards.unshift(
  {id:'new-tickets',label:'Tiket baru',table:'inquiries',filters:{status:'new'},status:'new',hint:'Buka permintaan yang belum ditangani'},
  {id:'active-tickets',label:'Tiket diproses',table:'inquiries',filters:{status:'in_progress'},status:'in_progress',hint:'Lanjutkan permintaan yang sedang diproses'}
 );
 return cards;
}
export async function loadDashboard(db,{admin,container,isCurrent,onOpen,onRefresh}){
 const cards=dashboardCards(admin);
 const cardHTML=(card,count,failed=false)=>`<button type="button" class="summary-card ${card.table==='inquiries'?'summary-ticket':''}" data-summary="${card.id}" ${failed?'disabled':''}><span class="summary-label">${card.label}</span><strong>${count===null?'—':esc(count.toLocaleString('id-ID'))}</strong><span class="summary-hint">${failed?'Belum bisa dimuat':card.hint}</span><span class="summary-arrow" aria-hidden="true">↗</span></button>`;
 function render(results){
  if(!isCurrent())return;
  const loading=!results,errors=results?.filter(r=>r.status==='rejected').length||0;
  container.innerHTML=`<div class="page-heading"><div><p class="eyebrow">RUANG PENGELOLAAN</p><h1>Ringkasan</h1><p class="muted">${admin?'Pantau permintaan pelanggan dan konten website.':'Pantau konten yang tampil di website.'}</p></div><button class="secondary" id="refresh-summary" ${loading?'disabled':''}>${loading?'Memuat…':'Perbarui'}</button></div><p class="summary-status ${errors?'error':'muted'}" role="status">${loading?'Memuat ringkasan…':errors?'Sebagian ringkasan belum bisa dimuat. Ketuk Perbarui untuk mencoba lagi.':'Diperbarui '+new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Makassar'}).format(new Date())+' WITA · Ketuk kartu untuk membuka daftarnya.'}</p><div class="summary-grid" aria-busy="${loading}">${cards.map((card,i)=>cardHTML(card,results?.[i].status==='fulfilled'?results[i].value:null,loading||results?.[i].status==='rejected')).join('')}</div>`;
  container.insertAdjacentHTML('beforeend',`<section class="dashboard-tasks" aria-labelledby="dashboard-tasks-title"><h2 id="dashboard-tasks-title">Mulai dari sini</h2><p>Pilih pekerjaan yang ingin kamu lakukan.</p><div class="dashboard-task-grid">${dashboardTasks(admin).map(task=>`<button type="button" class="dashboard-task" data-task="${task.section}">${panelIcon(task.section)}<span><strong>${task.label}</strong><small>${sectionHint(task.section)}</small></span><span class="task-arrow" aria-hidden="true">↗</span></button>`).join('')}</div></section>`);
  container.querySelectorAll('[data-task]').forEach(button=>button.onclick=()=>onOpen(button.dataset.task,{}));
  container.querySelector('#refresh-summary').onclick=onRefresh;
  container.querySelectorAll('[data-summary]').forEach(button=>{const card=cards.find(c=>c.id===button.dataset.summary);button.onclick=()=>onOpen(card.table,{status:card.status,availability:card.availability||''});});
 }
 render();
 const results=await Promise.allSettled(cards.map(async card=>{
  let query=db.from(card.table).select('id',{count:'exact',head:true});
  for(const [field,value] of Object.entries(card.filters))query=query.eq(field,value);
  const result=await query.abortSignal(AbortSignal.timeout(15000));
  if(result.error||!Number.isInteger(result.count)||result.count<0)throw Error('Ringkasan belum bisa dimuat.');
  return result.count;
 }));
 render(results);
}
