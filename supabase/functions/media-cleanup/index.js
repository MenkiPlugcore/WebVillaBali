import {cleanupRPC,drainMediaCleanup} from '../_shared/media-cleanup.js';
export async function handle(req,env){
 const reply=(data,status)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const token=req.headers.get('x-cleanup-token');
 if(!token||!/^[0-9a-f]{64}$/.test(token))return reply({error:'Unauthorized'},401);
 try{
  if(await cleanupRPC(env,{p_action:'verify',p_token:token})!==true)return reply({error:'Unauthorized'},401);
  const result=await drainMediaCleanup(env);
  return reply({success:!result.warning},result.warning?503:200);
 }catch{return reply({error:'Cleanup unavailable'},503);}
}
if(typeof Deno!=='undefined')Deno.serve(req=>handle(req,{url:Deno.env.get('SUPABASE_URL'),key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}));
