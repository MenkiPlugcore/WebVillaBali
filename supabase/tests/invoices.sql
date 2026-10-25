begin;
-- Synthetic identities and invoices only. No real login, payment or notification.
insert into auth.users(id,email,raw_app_meta_data,created_at) values
('10000000-0000-4000-8000-000000000801','invoice-owner@example.invalid','{"aup_role":"owner"}',now()),
('10000000-0000-4000-8000-000000000802','invoice-admin@example.invalid','{"aup_role":"admin"}',now()),
('10000000-0000-4000-8000-000000000803','invoice-editor@example.invalid','{"aup_role":"editor"}',now()),
('10000000-0000-4000-8000-000000000804','invoice-dev@example.invalid','{"aup_role":"developer"}',now());
insert into auth.sessions(id,user_id,aal,created_at)
select ('10000000-0000-4000-8000-000000000'||(i+10)::text)::uuid,('10000000-0000-4000-8000-000000000'||i::text)::uuid,'aal2',now() from generate_series(801,804) i;
insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at)
select gen_random_uuid(),('10000000-0000-4000-8000-000000000'||i::text)::uuid,'totp','verified',now(),now() from generate_series(801,804) i;
insert into public.developer_grants(user_id,enabled) values('10000000-0000-4000-8000-000000000804',true);
insert into public.inquiries(id,inquiry_type,name,email,message,language) values
('10000000-0000-4000-8000-000000000821','general','Invoice test customer','invoice-customer@example.invalid','Please prepare an invoice.','en');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000801","session_id":"10000000-0000-4000-8000-000000000811","aal":"aal2","role":"authenticated"}',true);
select set_config('aup.invoice_test_payload',jsonb_build_object('id','10000000-0000-4000-8000-000000000831','expected_revision',0,
 'inquiry_id','10000000-0000-4000-8000-000000000821','summary','DP rental agreement','payment_kind','deposit','payment_method','bca','currency','IDR','amount_minor',1500000,
 'due_date',((timezone('Asia/Makassar',now()))::date+7)::text,'notes','Customer note','terms','Confirmed cancellation terms for this booking.','bca_account_name','Synthetic merchant','bca_account_number','1234567890')::text,true);
set local role authenticated;
do $$declare first_result jsonb; second_result jsonb; p jsonb:=current_setting('aup.invoice_test_payload')::jsonb;begin
 first_result:=public.invoice_admin('save',p);second_result:=public.invoice_admin('save',p);
 if first_result->'invoice'->>'invoice_no'<>second_result->'invoice'->>'invoice_no' or jsonb_array_length(second_result->'events')<>1 then raise exception 'Duplicate draft on retry';end if;
 if first_result->'invoice'->>'customer_name'<>'Invoice test customer' or first_result->'invoice'->>'customer_email'<>'invoice-customer@example.invalid' then raise exception 'Customer snapshot missing';end if;
 begin perform public.invoice_admin('save',p||'{"status":"paid"}'::jsonb);raise exception 'Status forged';exception when invalid_parameter_value then null;end;
 begin perform public.invoice_admin('save',p||'{"customer_name":"Forged"}'::jsonb);raise exception 'Customer forged';exception when invalid_parameter_value then null;end;
 begin perform public.invoice_admin('save',p||'{"amount_minor":0}'::jsonb);raise exception 'Zero amount';exception when invalid_parameter_value then null;end;
 begin perform public.invoice_admin('save',p||'{"amount_minor":1.2}'::jsonb);raise exception 'Fractional minor';exception when invalid_parameter_value then null;end;
 begin perform public.invoice_admin('save',p||'{"currency":"USD"}'::jsonb);raise exception 'Currency mismatch';exception when invalid_parameter_value then null;end;
 begin perform public.invoice_admin('save',p||'{"summary":"Changed without revision"}'::jsonb);raise exception 'Lost update';exception when serialization_failure then null;end;
 perform public.invoice_admin('save',p||'{"expected_revision":1,"summary":"Approved deposit"}'::jsonb);
 begin perform public.invoice_admin('issue','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":1}');raise exception 'Stale issue accepted';exception when serialization_failure then null;end;
 perform public.invoice_admin('issue','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":2}');
 perform public.invoice_admin('issue','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":2}');
 if jsonb_array_length(public.invoice_admin('get','{"id":"10000000-0000-4000-8000-000000000831"}')->'events')<>3 then raise exception 'Duplicate issue audit';end if;
 begin perform public.invoice_admin('save',p||'{"expected_revision":3}');raise exception 'Issued details changed';exception when invalid_parameter_value then null;end;
 begin perform public.invoice_admin('confirm_bca','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":3,"amount_minor":1,"currency":"IDR","reference":"BANK-REF-001","verified":true}');raise exception 'Wrong amount paid';exception when invalid_parameter_value then null;end;
 begin perform public.invoice_admin('confirm_bca','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":3,"amount_minor":1500000,"currency":"IDR","reference":"BANK-REF-001","verified":false}');raise exception 'Unchecked settlement paid';exception when invalid_parameter_value then null;end;
 perform public.invoice_admin('confirm_bca','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":3,"amount_minor":1500000,"currency":"IDR","reference":"BANK-REF-001","verified":true}');
 second_result:=public.invoice_admin('confirm_bca','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":3,"amount_minor":1500000,"currency":"IDR","reference":"BANK-REF-001","verified":true}');
 if second_result->'invoice'->>'status'<>'paid' or jsonb_array_length(second_result->'events')<>4 or second_result->'invoice'->>'verified_by'<>auth.uid()::text then raise exception 'Settlement retry duplicated or actor forged';end if;
 begin perform public.invoice_admin('cancel','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":4,"reason":"Cancel after settlement"}');raise exception 'Paid cancelled';exception when serialization_failure then null;end;
 perform public.invoice_admin('save',p||'{"id":"10000000-0000-4000-8000-000000000832"}'::jsonb);
 perform public.invoice_admin('issue','{"id":"10000000-0000-4000-8000-000000000832","expected_revision":1}');
 begin perform public.invoice_admin('confirm_bca','{"id":"10000000-0000-4000-8000-000000000832","expected_revision":2,"amount_minor":1500000,"currency":"IDR","reference":"bank-ref-001","verified":true}');raise exception 'Transfer reused';exception when unique_violation then null;end;
 perform public.invoice_admin('save',p||'{"id":"10000000-0000-4000-8000-000000000833","payment_method":"paypal","currency":"USD","amount_minor":12550}'::jsonb);
 begin perform public.invoice_admin('issue','{"id":"10000000-0000-4000-8000-000000000833","expected_revision":1}');raise exception 'Unconfigured PayPal issued';exception when invalid_parameter_value then null;end;
 begin perform public.invoice_admin('confirm_bca','{"id":"10000000-0000-4000-8000-000000000833","expected_revision":1,"amount_minor":12550,"currency":"USD","reference":"FAKE-PAYPAL","verified":true}');raise exception 'PayPal manually paid';exception when invalid_parameter_value then null;end;
 perform public.invoice_admin('cancel','{"id":"10000000-0000-4000-8000-000000000833","expected_revision":1,"reason":"Customer changed plans"}');
 begin perform public.invoice_admin('issue','{"id":"10000000-0000-4000-8000-000000000833","expected_revision":2}');raise exception 'Cancelled reissued';exception when serialization_failure then null;end;
 perform public.invoice_admin('save',p||'{"id":"10000000-0000-4000-8000-000000000834","terms":"","bca_account_number":""}'::jsonb);
 begin perform public.invoice_admin('issue','{"id":"10000000-0000-4000-8000-000000000834","expected_revision":1}');raise exception 'Incomplete invoice issued';exception when invalid_parameter_value then null;end;
 if public.invoice_admin('list','{"status":"paid","search":"Invoice test customer"}')->>'total'<>'1' then raise exception 'Paid filter incorrect';end if;
 begin perform 1 from aup_private.invoices;raise exception 'Direct invoice read';exception when insufficient_privilege then null;end;
 begin update aup_private.invoices set status='paid';raise exception 'Direct write';exception when insufficient_privilege then null;end;
 begin insert into aup_private.invoice_events(invoice_id,action,actor_role) values('10000000-0000-4000-8000-000000000831','bca_confirmed','owner');raise exception 'Audit forged';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- Admin and active developer have finance access; editors cannot spoof it in JWT metadata.
set local role authenticated;
do $$declare i integer;begin
 for i in 802..804 loop
  perform set_config('request.jwt.claims',jsonb_build_object('sub','10000000-0000-4000-8000-000000000'||i::text,'session_id','10000000-0000-4000-8000-000000000'||(i+10)::text,'aal','aal2','role','authenticated','app_metadata',jsonb_build_object('aup_role','owner'))::text,true);
  if i=803 then
   begin perform public.invoice_admin('list');raise exception 'Editor invoice read';exception when insufficient_privilege then null;end;
   begin perform public.invoice_admin('tickets');raise exception 'Editor ticket lookup';exception when insufficient_privilege then null;end;
  else perform public.invoice_admin('list');end if;
 end loop;
end $$;
reset role;
update public.developer_grants set enabled=false where user_id='10000000-0000-4000-8000-000000000804';
set local role authenticated;
do $$begin
 begin perform public.invoice_admin('list');raise exception 'Revoked developer accepted';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000801","session_id":"10000000-0000-4000-8000-000000000811","aal":"aal1","role":"authenticated"}',true);
 begin perform public.invoice_admin('list');raise exception 'MFA bypass';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000801","session_id":"10000000-0000-4000-8000-000000000899","aal":"aal2","role":"authenticated"}',true);
 begin perform public.invoice_admin('list');raise exception 'Unknown session';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$begin
 if has_function_privilege('anon','public.invoice_admin(text,jsonb)','execute') then raise exception 'Anonymous RPC granted';end if;
 begin perform public.invoice_admin('list');raise exception 'Anonymous invoice read';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'passed: private invoice access, customer snapshot, exact amounts, currencies, locked issue, stale revisions, idempotent retries, manual BCA settlement, duplicate transfer denial, PayPal gate, cancellation, audit, owner/admin/developer access, editor/anonymous/MFA/session/revocation denial; all fixtures rolled back' as verification;
