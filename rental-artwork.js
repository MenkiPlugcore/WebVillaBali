(() => {
 const endpoint='https://tvcmwkzwemrwwewphfgh.supabase.co/functions/v1/public-catalog?kind=site_media';
 let artwork='';
 function render(){
  if(!artwork)return;
  document.querySelectorAll('.rental-hero-media,.motor-teaser-media').forEach(el=>{el.style.backgroundImage='url("'+artwork+'")';});
 }
 document.addEventListener('aup:mobility-rendered',render);
 async function load(){
  try{
   const response=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(20000)});
   if(!response.ok)return;
   const data=await response.json(),version=data.media?.rental_hero?.version;
   if(typeof version!=='string'||!Number.isFinite(Date.parse(version)))return;
   const url=endpoint+'&image=rental_hero&v='+encodeURIComponent(version);
   const preload=new Image();preload.onload=()=>{artwork=url;render();};preload.src=url;
  }catch{/* Keep the built-in image if custom artwork cannot be loaded. */}
 }
 load();
})();
