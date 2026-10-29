import {handle} from './handler.ts';
export {handle};
Deno.serve((req:Request)=>handle(req,{url:Deno.env.get('SUPABASE_URL')!,key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}));
