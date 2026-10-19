begin;
-- Database-only fixtures: no credentials, activation tokens or invitations.
insert into auth.users(id,email,raw_app_meta_data,created_at) values
('00000000-0000-4000-8000-000000000401','provision-owner@example.invalid','{"aup_role":"owner"}',now()),
('00000000-0000-4000-8000-000000000402','provision-admin@example.invalid','{"aup_role":"admin"}',now());
insert into auth.sessions(id,user_id,aal,created_at) values
('00000000-0000-4000-8000-000000000411','00000000-0000-4000-8000-000000000401','aal2',now()),
('00000000-0000-4000-8000-000000000412','00000000-0000-4000-8000-000000000402','aal2',now());
insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at)
select gen_random_uuid(),id,'totp','verified',now(),now() from auth.users where id in ('00000000-0000-4000-8000-000000000401','00000000-0000-4000-8000-000000000402');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000401","session_id":"00000000-0000-4000-8000-000000000411","aal":"aal2","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 begin perform public.begin_staff_account('create','invalid','editor');raise exception 'Invalid email';exception when invalid_parameter_value then null;end;
 begin perform public.begin_staff_account('create','new@example.invalid','owner');raise exception 'Owner creation';exception when invalid_parameter_value then null;end;
 begin perform public.begin_staff_account('create','provision-owner@example.invalid','editor');raise exception 'Existing owner overwrite';exception when unique_violation then null;end;
 begin perform public.begin_staff_account('activate',p_user_id=>'00000000-0000-4000-8000-000000000401');raise exception 'Owner activation allowed';exception when insufficient_privilege then null;end;
 begin perform public.begin_staff_account('activate',p_user_id=>'00000000-0000-4000-8000-000000000402');raise exception 'Existing MFA activation allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('aup.test_staff_request',public.begin_staff_account('create','provision-new@example.invalid','editor')->>'request_id',true);
reset role;
insert into auth.users(id,email,raw_app_meta_data,created_at) values ('00000000-0000-4000-8000-000000000403','provision-new@example.invalid',jsonb_build_object('aup_role','editor','aup_staff_role','editor','aup_staff_request',current_setting('aup.test_staff_request')),clock_timestamp());
set local role authenticated;
do $$begin
 begin perform public.finish_staff_account(current_setting('aup.test_staff_request')::uuid,'00000000-0000-4000-8000-000000000402');raise exception 'Different account accepted';exception when insufficient_privilege then null;end;
 if public.finish_staff_account(current_setting('aup.test_staff_request')::uuid,'00000000-0000-4000-8000-000000000403')->>'link_type'<>'invite' then raise exception 'Wrong initial activation type';end if;
 begin perform public.finish_staff_account(current_setting('aup.test_staff_request')::uuid,'00000000-0000-4000-8000-000000000403');raise exception 'Request replay';exception when invalid_parameter_value then null;end;
 if has_table_privilege('authenticated','aup_private.staff_account_requests','select') then raise exception 'Private request data exposed';end if;
end $$;
select set_config('aup.test_staff_request',public.begin_staff_account('activate',p_user_id=>'00000000-0000-4000-8000-000000000403')->>'request_id',true);
select public.finish_staff_account(current_setting('aup.test_staff_request')::uuid,'00000000-0000-4000-8000-000000000403')->>'link_type'='invite' as unconfirmed_invite;
reset role;
update auth.users set email_confirmed_at=now() where id='00000000-0000-4000-8000-000000000403';
set local role authenticated;
select set_config('aup.test_staff_request',public.begin_staff_account('activate',p_user_id=>'00000000-0000-4000-8000-000000000403')->>'request_id',true);
select public.finish_staff_account(current_setting('aup.test_staff_request')::uuid,'00000000-0000-4000-8000-000000000403')->>'link_type'='recovery' as confirmed_incomplete_setup;
do $$begin
 perform public.begin_staff_account('create','rate1@example.invalid','editor');
 perform public.begin_staff_account('create','rate2@example.invalid','editor');
 begin perform public.begin_staff_account('create','rate3@example.invalid','editor');raise exception 'Rate limit bypass';exception when program_limit_exceeded then null;end;
end $$;
reset role;
-- Revocation and AAL checks are repeated server-side, not trusted from UI/JWT role.
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000402","session_id":"00000000-0000-4000-8000-000000000412","aal":"aal2","role":"authenticated","app_metadata":{"aup_role":"owner"}}',true);
set local role authenticated;
do $$begin
 begin perform public.begin_staff_account('create','bad@example.invalid','admin');raise exception 'Admin created account';exception when insufficient_privilege then null;end;
 begin perform public.finish_staff_account(current_setting('aup.test_staff_request')::uuid,'00000000-0000-4000-8000-000000000403');raise exception 'Admin completed request';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000401","session_id":"00000000-0000-4000-8000-000000000411","aal":"aal1","role":"authenticated"}',true);
set local role authenticated;
do $$begin begin perform public.begin_staff_account('create','bad@example.invalid','editor');raise exception 'Password-only provisioning';exception when insufficient_privilege then null;end;end $$;
reset role;
set local role anon;
do $$begin
 if has_function_privilege('anon','public.begin_staff_account(text,text,text,uuid)','execute') or has_function_privilege('anon','public.finish_staff_account(uuid,uuid)','execute') then raise exception 'Anonymous provisioning grant';end if;
end $$;
reset role;
do $$begin if (select count(*) from public.staff_activity where actor_id='00000000-0000-4000-8000-000000000401' and table_name in ('staff_accounts','staff_activation'))<>3 then raise exception 'Missing provisioning audit';end if;end $$;
rollback;
select 'passed: owner/MFA-only provisioning, role bounds, existing/protected accounts, binding/replay, private requests, rate limiting, incomplete setup recovery and audit; all fixtures rolled back' as verification;
