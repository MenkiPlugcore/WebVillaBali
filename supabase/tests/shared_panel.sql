begin;
-- Rollback-only authorization fixtures. No login credentials, tokens or messages.
insert into auth.users(id,email,raw_app_meta_data,created_at) values
('10000000-0000-4000-8000-000000000501','shared-owner@example.invalid','{"aup_role":"owner"}',now()),
('10000000-0000-4000-8000-000000000502','shared-dev@example.invalid','{"aup_role":"developer"}',now()),
('10000000-0000-4000-8000-000000000503','shared-other-dev@example.invalid','{"aup_role":"developer"}',now()),
('10000000-0000-4000-8000-000000000504','shared-admin@example.invalid','{"aup_role":"admin"}',now()),
('10000000-0000-4000-8000-000000000505','shared-editor@example.invalid','{"aup_role":"editor"}',now()),
('10000000-0000-4000-8000-000000000506','shared-employee@example.invalid','{}',now());
insert into auth.sessions(id,user_id,aal,created_at)
select ('10000000-0000-4000-8000-000000000'||(i+10)::text)::uuid,
 ('10000000-0000-4000-8000-000000000'||i::text)::uuid,'aal2',now()
 from generate_series(501,505) i;
insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at)
select gen_random_uuid(),('10000000-0000-4000-8000-000000000'||i::text)::uuid,'totp','verified',now(),now()
 from generate_series(501,505) i;
insert into public.developer_grants(user_id,enabled) values
('10000000-0000-4000-8000-000000000502',true),('10000000-0000-4000-8000-000000000503',true);
insert into public.staff_activity(actor_id,actor_role,table_name,record_key,action)
 values('10000000-0000-4000-8000-000000000501','owner','properties','shared-other-audit','UPDATE');

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000502","session_id":"10000000-0000-4000-8000-000000000512","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 if not public.developer_access() then raise exception 'Active developer denied';end if;
 perform public.manage_staff_access(p_email=>'shared-employee@example.invalid',p_role=>'editor',p_enabled=>true);
 if not exists(select 1 from public.staff_activity where actor_id=auth.uid() and actor_role='developer' and table_name='staff_access') then raise exception 'Developer action falsely attributed';end if;
 if not exists(select 1 from public.staff_activity where record_key='shared-other-audit') then raise exception 'Shared audit hidden';end if;
 if not public.manage_developer_access() @> '[{"user_id":"10000000-0000-4000-8000-000000000502","can_manage":false}]'::jsonb then raise exception 'Self access not marked protected';end if;
 begin perform public.manage_developer_access(auth.uid(),true);raise exception 'Self grant accepted';exception when insufficient_privilege then null;end;
 perform public.manage_developer_access('10000000-0000-4000-8000-000000000503',false);
 perform public.manage_developer_access('10000000-0000-4000-8000-000000000503',true);
 begin perform public.manage_staff_access(p_user_id=>'10000000-0000-4000-8000-000000000501',p_role=>'admin',p_enabled=>true);raise exception 'Owner changed';exception when insufficient_privilege then null;end;
 begin perform public.manage_staff_access(p_user_id=>auth.uid(),p_role=>'admin',p_enabled=>true);raise exception 'Developer role changed';exception when insufficient_privilege then null;end;
 begin perform public.begin_staff_account('create','shared-elevated@example.invalid','owner');raise exception 'Owner role created';exception when invalid_parameter_value then null;end;
 begin perform public.begin_staff_account('activate',p_user_id=>'10000000-0000-4000-8000-000000000501');raise exception 'Owner activation exposed';exception when insufficient_privilege then null;end;
 begin insert into public.staff_activity(actor_id,actor_role,table_name,record_key,action) values(auth.uid(),'owner','x','x','INSERT');raise exception 'Audit forged';exception when insufficient_privilege then null;end;
end $$;
select set_config('aup.test_shared_request',public.begin_staff_account('create','shared-new@example.invalid','editor')->>'request_id',true);
reset role;
insert into auth.users(id,email,raw_app_meta_data,created_at) values
('10000000-0000-4000-8000-000000000507','shared-new@example.invalid',jsonb_build_object('aup_role','editor','aup_staff_role','editor','aup_staff_request',current_setting('aup.test_shared_request')),clock_timestamp());
-- A request is bound to its actor, even if another manager is an owner.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000501","session_id":"10000000-0000-4000-8000-000000000511","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 begin perform public.finish_staff_account(current_setting('aup.test_shared_request')::uuid,'10000000-0000-4000-8000-000000000507');raise exception 'Other manager completed request';exception when invalid_parameter_value then null;end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000502","session_id":"10000000-0000-4000-8000-000000000512","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 if public.finish_staff_account(current_setting('aup.test_shared_request')::uuid,'10000000-0000-4000-8000-000000000507')->>'link_type'<>'invite' then raise exception 'Developer provisioning denied';end if;
 if not exists(select 1 from public.staff_activity where actor_id=auth.uid() and actor_role='developer' and table_name='staff_accounts') then raise exception 'Provisioning role attribution missing';end if;
 begin perform public.finish_staff_account(current_setting('aup.test_shared_request')::uuid,'10000000-0000-4000-8000-000000000507');raise exception 'Request replay accepted';exception when invalid_parameter_value then null;end;
end $$;
select set_config('aup.test_shared_request',public.begin_staff_account('activate',p_user_id=>'10000000-0000-4000-8000-000000000507')->>'request_id',true);
select public.finish_staff_account(current_setting('aup.test_shared_request')::uuid,'10000000-0000-4000-8000-000000000507');
reset role;
-- Employees cannot gain manager powers from stale/spoofed JWT metadata.
set local role authenticated;
do $$declare i integer;begin
 for i in 504..505 loop
  perform set_config('request.jwt.claims',jsonb_build_object('sub','10000000-0000-4000-8000-000000000'||i::text,'session_id','10000000-0000-4000-8000-000000000'||(i+10)::text,'aal','aal2','role','authenticated','app_metadata',jsonb_build_object('aup_role','owner'))::text,true);
  begin perform public.manage_staff_access();raise exception 'Employee team read';exception when insufficient_privilege then null;end;
  begin perform public.manage_developer_access();raise exception 'Employee grant read';exception when insufficient_privilege then null;end;
  begin perform public.begin_staff_account('create','bad@example.invalid','editor');raise exception 'Employee provision';exception when insufficient_privilege then null;end;
  if exists(select 1 from public.staff_activity) then raise exception 'Employee audit exposed';end if;
 end loop;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000502","session_id":"10000000-0000-4000-8000-000000000512","aal":"aal1","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 begin perform public.manage_staff_access();raise exception 'MFA bypass';exception when insufficient_privilege then null;end;
 begin perform public.begin_staff_account('create','bad@example.invalid','editor');raise exception 'MFA provisioning bypass';exception when insufficient_privilege then null;end;
 begin perform public.manage_developer_access();raise exception 'MFA grant bypass';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- Owner revocation takes effect even for management requests already in progress.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000502","session_id":"10000000-0000-4000-8000-000000000512","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
select set_config('aup.test_shared_request',public.begin_staff_account('activate',p_user_id=>'10000000-0000-4000-8000-000000000507')->>'request_id',true);
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000501","session_id":"10000000-0000-4000-8000-000000000511","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
select public.manage_developer_access('10000000-0000-4000-8000-000000000502',false);
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000502","session_id":"10000000-0000-4000-8000-000000000512","aal":"aal2","role":"authenticated","app_metadata":{"aup_role":"owner"}}',true);
set local role authenticated;
do $$begin
 if public.developer_access() then raise exception 'Revoked developer accepted';end if;
 begin perform public.manage_staff_access();raise exception 'Revoked team read';exception when insufficient_privilege then null;end;
 begin perform public.manage_developer_access();raise exception 'Revoked grant read';exception when insufficient_privilege then null;end;
 begin perform public.finish_staff_account(current_setting('aup.test_shared_request')::uuid,'10000000-0000-4000-8000-000000000507');raise exception 'Revoked provisioning completed';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.staff_activity) then raise exception 'Revoked audit exposed';end if;
end $$;
reset role;
set local role anon;
do $$begin
 if has_function_privilege('anon','public.manage_staff_access(text,uuid,text,boolean)','execute') then raise exception 'Anon management granted';end if;
 begin perform 1 from public.staff_activity;raise exception 'Anon audit exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'passed: shared owner/developer panel, employee provisioning, actor-bound requests, accurate audit, protected identities, MFA, self-grant prevention, employee denial and immediate revocation; all fixtures rolled back' as verification;

