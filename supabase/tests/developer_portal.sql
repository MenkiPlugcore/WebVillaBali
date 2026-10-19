begin;
-- SQL-only rollback fixtures; no actual credential, JWT or authenticator is issued.
insert into auth.users(id,email,raw_app_meta_data) values
('00000000-0000-4000-8000-000000000101','owner-dev-test@example.invalid','{"aup_role":"owner"}'),
('00000000-0000-4000-8000-000000000102','developer-test@example.invalid','{"aup_role":"developer"}'),
('00000000-0000-4000-8000-000000000103','other-dev-test@example.invalid','{"aup_role":"developer"}');
insert into auth.sessions(id,user_id,aal,not_after,created_at) values
('00000000-0000-4000-8000-000000000111','00000000-0000-4000-8000-000000000101','aal2',now()+interval '1 hour',now()),
('00000000-0000-4000-8000-000000000112','00000000-0000-4000-8000-000000000102','aal2',now()+interval '1 hour',now());
insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at)
select gen_random_uuid(),id,'totp','verified',now(),now() from auth.users where id in('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102');
insert into public.developer_grants(user_id,enabled) values
('00000000-0000-4000-8000-000000000102',true),('00000000-0000-4000-8000-000000000103',true);
insert into public.properties(id,slug,title_id,title_en,property_type,purpose) values
('00000000-0000-4000-8000-000000000121','dev-fixture-only','Rollback','Rollback','villa','rent');
insert into public.inquiries(id,inquiry_type,name,email,message) values ('00000000-0000-4000-8000-000000000122','general','Rollback','fixture@example.invalid','No real customer');
insert into public.staff_activity(actor_id,actor_role,table_name,record_key,action) values
('00000000-0000-4000-8000-000000000103','developer','properties','other-private','UPDATE');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000102","session_id":"00000000-0000-4000-8000-000000000112","role":"authenticated","aal":"aal2","user_metadata":{"aup_role":"owner"}}',true);
set local role authenticated;
do $$begin
 if not public.developer_access() or not public.staff_access() or not aup_private.is_admin() then raise exception 'Dev denied';end if;
 update public.properties set title_id='Dev update' where id='00000000-0000-4000-8000-000000000121';
 if not found then raise exception 'Dev property denied';end if;
 update public.inquiries set status='contacted',internal_notes='Not copied into activity' where id='00000000-0000-4000-8000-000000000122';
 if not found then raise exception 'Dev ticket denied';end if;
 if (select count(*) from public.staff_activity where actor_id=auth.uid())<>2 then raise exception 'Missing actor audit';end if;
 if exists(select 1 from public.staff_activity where actor_id<>auth.uid()) then raise exception 'Other actor audit exposed';end if;
 begin perform public.manage_developer_access('00000000-0000-4000-8000-000000000102',true);raise exception 'Dev self grant';exception when insufficient_privilege then null;end;
 begin delete from public.staff_activity;raise exception 'Dev audit delete';exception when insufficient_privilege then null;end;
 begin update public.developer_grants set enabled=true;raise exception 'Dev direct grant';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- MFA remains mandatory even with an active grant.
select set_config('request.jwt.claims',(current_setting('request.jwt.claims')::jsonb||'{"aal":"aal1"}')::text,true);
set local role authenticated;
do $$begin if public.developer_access() or public.staff_access() then raise exception 'Dev MFA bypass';end if;end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000101","session_id":"00000000-0000-4000-8000-000000000111","role":"authenticated","aal":"aal2"}',true);
set local role authenticated;
do $$begin
 if public.developer_access() then raise exception 'Owner dev door';end if;
 if not exists(select 1 from public.staff_activity where actor_id='00000000-0000-4000-8000-000000000102') then raise exception 'Owner audit denied';end if;
 perform public.manage_developer_access('00000000-0000-4000-8000-000000000102',false);
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000102","session_id":"00000000-0000-4000-8000-000000000112","role":"authenticated","aal":"aal2","app_metadata":{"aup_role":"owner"}}',true);
set local role authenticated;
do $$begin
 if public.developer_access() or public.staff_access() then raise exception 'Revoked grant ignored';end if;
 if exists(select 1 from public.inquiries) then raise exception 'Revoked dev ticket exposure';end if;
 update public.properties set title_id='Tampered' where id='00000000-0000-4000-8000-000000000121';
 if found then raise exception 'Revoked dev wrote';end if;
 if exists(select 1 from public.staff_activity) then raise exception 'Revoked dev log exposure';end if;
end $$;
reset role;
update public.developer_grants set enabled=true,expires_at=now()-interval '1 minute' where user_id='00000000-0000-4000-8000-000000000102';
set local role authenticated;
do $$begin if public.staff_access() then raise exception 'Expired dev grant';end if;end $$;
reset role;
set local role anon;
do $$begin
 begin perform 1 from public.staff_activity;raise exception 'Anon log exposed';exception when insufficient_privilege then null;end;
 if has_function_privilege('anon','public.manage_developer_access(uuid,boolean)','execute') then raise exception 'Anon grant RPC';end if;
end $$;
reset role;
rollback;
select 'passed: dev business access, owner-only revocation, MFA denial, audit attribution/isolation/immutability, stale grant expiry/revocation and anonymous denial; all fixtures rolled back' as verification;
