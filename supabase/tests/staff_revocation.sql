begin;
-- Database-only fixtures. No password, token or persistent account is created.
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data)
values ('74f847f1-f32d-450c-a64a-7af7d7368391','audit-only@example.invalid','{"aup_role":"admin"}','{}');
insert into auth.sessions(id,user_id,not_after)
values ('74f847f1-f32d-450c-a64a-7af7d7368392','74f847f1-f32d-450c-a64a-7af7d7368391',now()+interval '1 hour');
insert into public.inquiries(id,inquiry_type,name,email,message)
values ('74f847f1-f32d-450c-a64a-7af7d7368393','general','Audit only','audit-only@example.invalid','Rollback only');
select set_config('request.jwt.claims','{"sub":"74f847f1-f32d-450c-a64a-7af7d7368391","session_id":"74f847f1-f32d-450c-a64a-7af7d7368392","role":"authenticated","app_metadata":{"aup_role":"admin"},"user_metadata":{"aup_role":"owner"}}',true);
set local role authenticated;
do $$begin
 if not public.staff_access() or not aup_private.is_admin() then raise exception 'Active admin denied';end if;
 if not exists(select 1 from public.inquiries where id='74f847f1-f32d-450c-a64a-7af7d7368393') then raise exception 'Admin ticket denied';end if;
 begin update public.inquiries set email='tampered@example.invalid' where id='74f847f1-f32d-450c-a64a-7af7d7368393';raise exception 'Customer email overwrite accepted';exception when insufficient_privilege then null;end;
 if has_table_privilege('authenticated','public.inquiries','INSERT') or has_table_privilege('authenticated','public.inquiries','DELETE') then raise exception 'Excessive ticket privileges';end if;
end $$;
reset role;
-- Downgrade with exactly the same stale admin claims.
update auth.users set raw_app_meta_data='{"aup_role":"editor"}' where id='74f847f1-f32d-450c-a64a-7af7d7368391';
set local role authenticated;
do $$begin
 if not public.staff_access() or aup_private.is_admin() then raise exception 'Downgrade ignored';end if;
 if exists(select 1 from public.inquiries) then raise exception 'Editor ticket exposure';end if;
 update public.inquiries set status='closed' where id='74f847f1-f32d-450c-a64a-7af7d7368393';
 if found then raise exception 'Editor ticket write';end if;
end $$;
reset role;
update auth.users set raw_app_meta_data='{}' where id='74f847f1-f32d-450c-a64a-7af7d7368391';
set local role authenticated;
do $$begin
 if public.staff_access() or aup_private.is_admin() then raise exception 'Revoked role or user_metadata escalation';end if;
 begin insert into public.properties(slug,title_id,title_en,property_type,purpose) values ('audit-denied','Test','Test','villa','rent');raise exception 'Revoked role wrote';exception when insufficient_privilege then null;end;
end $$;
reset role;
update auth.users set raw_app_meta_data='{"aup_role":"admin"}' where id='74f847f1-f32d-450c-a64a-7af7d7368391';
update auth.sessions set not_after=now()-interval '1 minute' where id='74f847f1-f32d-450c-a64a-7af7d7368392';
set local role authenticated;
do $$begin if public.staff_access() then raise exception 'Expired session accepted';end if;end $$;
reset role;
select set_config('request.jwt.claims',(current_setting('request.jwt.claims')::jsonb||'{"session_id":"74f847f1-f32d-450c-a64a-7af7d7368399"}')::text,true);
set local role authenticated;
do $$begin if public.staff_access() then raise exception 'Revoked session accepted';end if;end $$;
reset role;
update auth.sessions set not_after=null where id='74f847f1-f32d-450c-a64a-7af7d7368392';
select set_config('request.jwt.claims',(current_setting('request.jwt.claims')::jsonb||'{"session_id":"74f847f1-f32d-450c-a64a-7af7d7368392"}')::text,true);
update auth.users set deleted_at=now() where id='74f847f1-f32d-450c-a64a-7af7d7368391';
set local role authenticated;
do $$begin if public.staff_access() then raise exception 'Deleted user accepted';end if;end $$;
reset role;
set local role anon;
do $$begin
 if aup_private.is_admin() then raise exception 'Anonymous admin';end if;
 if has_function_privilege('anon','public.staff_access()','execute') then raise exception 'Anonymous staff RPC grant';end if;
 if has_function_privilege('anon','public.submit_inquiry(uuid,text,jsonb)','execute') then raise exception 'Anonymous intake RPC grant';end if;
end $$;
reset role;
rollback;
select 'passed: active admin, editor downgrade, role removal, expired/revoked session, deleted user, metadata escalation and anon RPC denial; all fixtures rolled back' as verification;
