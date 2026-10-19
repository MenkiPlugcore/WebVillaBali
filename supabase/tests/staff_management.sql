begin;
-- Database-only fixtures. No credentials, invitation or usable JWT is created.
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
('00000000-0000-4000-8000-000000000201','team-owner@example.invalid','{"aup_role":"owner"}','{}'),
('00000000-0000-4000-8000-000000000202','team-editor@example.invalid','{"aup_role":"editor"}','{}'),
('00000000-0000-4000-8000-000000000203','team-admin@example.invalid','{"aup_role":"admin"}','{}'),
('00000000-0000-4000-8000-000000000204','team-dev@example.invalid','{"aup_role":"developer"}','{}'),
('00000000-0000-4000-8000-000000000205','team-employee@example.invalid','{"provider":"email"}','{"aup_role":"owner"}');
insert into auth.sessions(id,user_id,aal,created_at,not_after)
select ('00000000-0000-4000-8000-0000000003'||right(id::text,2))::uuid,id,'aal2',now()-interval '1 minute',now()+interval '1 hour'
from auth.users where id::text in ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000205');
insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at)
select gen_random_uuid(),id,'totp','verified',now(),now() from auth.users where id::text in ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000205');
insert into public.developer_grants(user_id,enabled) values ('00000000-0000-4000-8000-000000000204',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000201","session_id":"00000000-0000-4000-8000-000000000301","aal":"aal2","role":"authenticated","app_metadata":{"aup_role":"owner"}}',true);
set local role authenticated;
do $$declare items jsonb;begin
 items:=public.manage_staff_access();
 if exists(select 1 from jsonb_array_elements(items) e where e->>'user_id' in ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000204')) then raise exception 'Owner/developer leaked into employee manager';end if;
 if not exists(select 1 from jsonb_array_elements(items) e where e->>'user_id'='00000000-0000-4000-8000-000000000202') then raise exception 'Existing editor missing';end if;
 if exists(select 1 from jsonb_array_elements(items) e where e ? 'raw_app_meta_data' or e ? 'encrypted_password') then raise exception 'Private auth fields exposed';end if;
 begin perform public.manage_staff_access(p_user_id=>'00000000-0000-4000-8000-000000000201',p_role=>'editor',p_enabled=>true);raise exception 'Self/owner mutation accepted';exception when insufficient_privilege then null;end;
 begin perform public.manage_staff_access(p_user_id=>'00000000-0000-4000-8000-000000000204',p_role=>'admin',p_enabled=>true);raise exception 'Developer mutation accepted';exception when insufficient_privilege then null;end;
 begin perform public.manage_staff_access(p_user_id=>'00000000-0000-4000-8000-000000000205',p_role=>'owner',p_enabled=>true);raise exception 'Owner escalation accepted';exception when invalid_parameter_value then null;end;
 begin perform public.manage_staff_access(p_user_id=>'00000000-0000-4000-8000-000000000205',p_role=>'developer',p_enabled=>true);raise exception 'Developer escalation accepted';exception when invalid_parameter_value then null;end;
 begin perform public.manage_staff_access(p_email=>'missing@example.invalid',p_role=>'editor',p_enabled=>true);raise exception 'Unregistered account accepted';exception when no_data_found then null;end;
 begin perform public.manage_staff_access(p_email=>'team-employee@example.invalid',p_user_id=>'00000000-0000-4000-8000-000000000205',p_role=>'editor',p_enabled=>true);raise exception 'Ambiguous target accepted';exception when invalid_parameter_value then null;end;
 perform public.manage_staff_access(p_email=>' TEAM-EMPLOYEE@EXAMPLE.INVALID ',p_role=>'editor',p_enabled=>true);
end $$;
reset role;
do $$begin
 if (select raw_app_meta_data->>'aup_role' from auth.users where id='00000000-0000-4000-8000-000000000205')<>'editor' then raise exception 'Editor assignment failed';end if;
 if (select raw_app_meta_data->>'provider' from auth.users where id='00000000-0000-4000-8000-000000000205')<>'email' then raise exception 'Other metadata overwritten';end if;
end $$;
-- Pre-assignment session is rejected, even with spoofed owner user metadata.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000205","session_id":"00000000-0000-4000-8000-000000000305","aal":"aal2","role":"authenticated","app_metadata":{"aup_role":"owner"}}',true);
set local role authenticated;
do $$begin if public.staff_access() then raise exception 'Old pre-assignment session accepted';end if;end $$;
reset role;
insert into auth.sessions(id,user_id,aal,created_at,not_after) values ('00000000-0000-4000-8000-000000000306','00000000-0000-4000-8000-000000000205','aal2',clock_timestamp(),now()+interval '1 hour');
select set_config('request.jwt.claims',(current_setting('request.jwt.claims')::jsonb||'{"session_id":"00000000-0000-4000-8000-000000000306"}')::text,true);
set local role authenticated;
do $$begin
 if not public.staff_access() or aup_private.is_admin() then raise exception 'Fresh editor permissions incorrect';end if;
 if exists(select 1 from public.inquiries) or exists(select 1 from public.staff_activity) then raise exception 'Editor private data exposure';end if;
 begin perform public.manage_staff_access();raise exception 'Editor team read accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- Owner upgrades the employee. The old editor session is no longer reusable.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000201","session_id":"00000000-0000-4000-8000-000000000301","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
select public.manage_staff_access(p_user_id=>'00000000-0000-4000-8000-000000000205',p_role=>'admin',p_enabled=>true) is not null as upgrade;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000205","session_id":"00000000-0000-4000-8000-000000000306","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
do $$begin if public.staff_access() then raise exception 'Old session reused after role change';end if;end $$;
reset role;
insert into auth.sessions(id,user_id,aal,created_at,not_after) values ('00000000-0000-4000-8000-000000000307','00000000-0000-4000-8000-000000000205','aal2',clock_timestamp(),now()+interval '1 hour');
select set_config('request.jwt.claims',(current_setting('request.jwt.claims')::jsonb||'{"session_id":"00000000-0000-4000-8000-000000000307","app_metadata":{"aup_role":"editor"}}')::text,true);
set local role authenticated;
do $$begin if not public.staff_access() or not aup_private.is_admin() then raise exception 'Fresh admin role or live metadata ignored';end if;end $$;
reset role;
-- Admin, editor and developer cannot read/change the team, even with owner JWT claims.
set local role authenticated;
do $$declare i integer;begin
 for i in 202..204 loop
  perform set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000'||i::text,'session_id','00000000-0000-4000-8000-000000000'||(i+100)::text,'role','authenticated','aal','aal2','app_metadata',jsonb_build_object('aup_role','owner'))::text,true);
  begin perform public.manage_staff_access();raise exception 'Non-owner team read accepted';exception when insufficient_privilege then null;end;
  begin perform public.manage_staff_access(p_user_id=>'00000000-0000-4000-8000-000000000205',p_role=>'admin',p_enabled=>true);raise exception 'Non-owner team write accepted';exception when insufficient_privilege then null;end;
 end loop;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000201","session_id":"00000000-0000-4000-8000-000000000301","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
select public.manage_staff_access(p_user_id=>'00000000-0000-4000-8000-000000000205',p_role=>'admin',p_enabled=>false) is not null as disabled;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000205","session_id":"00000000-0000-4000-8000-000000000307","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
do $$begin if public.staff_access() or aup_private.is_admin() then raise exception 'Disabled account access';end if;end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000201","session_id":"00000000-0000-4000-8000-000000000301","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
select public.manage_staff_access(p_user_id=>'00000000-0000-4000-8000-000000000205',p_role=>'editor',p_enabled=>true) is not null as reenabled;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000205","session_id":"00000000-0000-4000-8000-000000000307","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
do $$begin if public.staff_access() then raise exception 'Reactivation revived old session';end if;end $$;
reset role;
-- Password-only owners and anonymous visitors cannot use management RPCs.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000201","session_id":"00000000-0000-4000-8000-000000000301","aal":"aal1","role":"authenticated"}',true);
set local role authenticated;
do $$begin begin perform public.manage_staff_access();raise exception 'MFA bypass';exception when insufficient_privilege then null;end;end $$;
reset role;
set local role anon;
do $$begin if has_function_privilege('anon','public.manage_staff_access(text,uuid,text,boolean)','execute') then raise exception 'Anonymous grant';end if;end $$;
reset role;
do $$begin if (select count(*) from public.staff_activity where actor_id='00000000-0000-4000-8000-000000000201' and table_name='staff_access')<>4 then raise exception 'Missing access change audit';end if;end $$;
rollback;
select 'passed: owner-only team management, protected owner/developer, no escalation, editor/admin split, MFA, disabled/re-enabled/changed-role old session denial, safe listing and audit; fixtures rolled back' as verification;
