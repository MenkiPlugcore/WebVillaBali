import {createClient} from '@supabase/supabase-js';
import {activationParams,mountActivation} from './activation.js';
const params=activationParams(window.location.hash);
// The token stays in memory only; remove it from the visible URL and history.
if(window.location.hash)window.history.replaceState(null,'',window.location.pathname);
const db=createClient('https://tvcmwkzwemrwwewphfgh.supabase.co','sb_publishable_ctqO41Koy2Q_TdHjYRkCkQ_5wcL-id2',{auth:{storageKey:'aup-staff-activation',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
await mountActivation(document.querySelector('#app'),db.auth,params);
