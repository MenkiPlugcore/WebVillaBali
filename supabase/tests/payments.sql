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
-- All settings, encrypted synthetic secrets and checkout fixtures roll back.
set local role authenticated;
do $$begin
 perform public.payment_settings('save_bca','{"account_name":"Synthetic owner","account_number":"1234567890"}');
 if public.payment_settings('get')->>'bca_account_number'<>'1234567890' then raise exception 'Default account missing';end if;
 if public.payment_settings('get') ? 'secret' then raise exception 'Secret leaked';end if;
 begin perform public.payments_backend('credentials');raise exception 'Client read credentials';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000802","session_id":"10000000-0000-4000-8000-000000000812","aal":"aal2","role":"authenticated"}',true);
 begin perform public.payment_settings('save_bca','{"account_name":"Wrong","account_number":"9876543210"}');raise exception 'Admin changed merchant';exception when insufficient_privilege then null;end;
 begin perform public.invoice_admin('save',current_setting('aup.invoice_test_payload')::jsonb||'{"id":"10000000-0000-4000-8000-000000000835","bca_account_name":"Wrong account","bca_account_number":"9876543210"}'::jsonb);raise exception 'Admin redirected bank transfer';exception when insufficient_privilege then null;end;
 perform public.invoice_admin('save',current_setting('aup.invoice_test_payload')::jsonb||'{"id":"10000000-0000-4000-8000-000000000835","bca_account_name":"Synthetic owner","bca_account_number":"1234567890"}'::jsonb);

 perform set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000803","session_id":"10000000-0000-4000-8000-000000000813","aal":"aal2","role":"authenticated"}',true);
 begin perform public.payment_settings('get');raise exception 'Editor finance read';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000801","session_id":"10000000-0000-4000-8000-000000000811","aal":"aal2","role":"authenticated"}',true);
set local role service_role;
select public.payments_backend('connect',jsonb_build_object('environment','sandbox','client_id','synthetic_client_1234567890','secret','synthetic_secret_never_real','merchant_id','MERCHANT12345','webhook_id','WEBHOOK12345','expected_revision',2,'actor','{"sub":"10000000-0000-4000-8000-000000000801","session_id":"10000000-0000-4000-8000-000000000811","aal":"aal2","role":"authenticated"}'::jsonb));
reset role;
set local role authenticated;
do $$declare p jsonb:=current_setting('aup.invoice_test_payload')::jsonb;begin
 perform public.invoice_admin('save',p||'{"payment_method":"paypal","currency":"USD","amount_minor":12550}'::jsonb);
 begin perform public.invoice_admin('issue','{"id":"10000000-0000-4000-8000-000000000831"}');raise exception 'Missing revision issued';exception when serialization_failure then null;end;
 perform public.invoice_admin('issue','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":1}');
 if public.invoice_admin('get','{"id":"10000000-0000-4000-8000-000000000831"}')->'invoice'->>'paypal_environment'<>'sandbox' then raise exception 'Environment snapshot missing';end if;
end $$;
reset role;
select set_config('aup.test_token',(select checkout_token from aup_private.invoices where id='10000000-0000-4000-8000-000000000831'),true);
set local role service_role;
do $$declare a jsonb;b jsonb;tok text:=current_setting('aup.test_token');begin
 a:=public.payments_backend('view',jsonb_build_object('token',tok));
 if a ? 'customer_email' or a ? 'customer_phone' or a ? 'customer_name' or a ? 'secret' or a ? 'id' then raise exception 'Private fields exposed';end if;
 a:=public.payments_backend('begin',jsonb_build_object('token',tok));b:=public.payments_backend('begin',jsonb_build_object('token',tok));
 if a->>'create_request_id'<>b->>'create_request_id' then raise exception 'Duplicate attempt';end if;
 perform public.payments_backend('bind','{"invoice_id":"10000000-0000-4000-8000-000000000831","order_id":"PAYPALORDER1234567"}');
 begin perform public.payments_backend('bind','{"invoice_id":"10000000-0000-4000-8000-000000000831","order_id":"OTHERORDER1234567"}');raise exception 'Order replaced';exception when serialization_failure then null;end;
 begin perform public.payments_backend('paid','{"invoice_id":"10000000-0000-4000-8000-000000000831","order_id":"PAYPALORDER1234567","capture_id":"PAYPALCAPTURE12345","amount_minor":1,"currency":"USD","environment":"sandbox","event_id":"WH-1"}');raise exception 'Wrong amount paid';exception when invalid_parameter_value then null;end;
end $$;
reset role;
set local role authenticated;
do $$begin
 begin perform public.invoice_admin('cancel','{"id":"10000000-0000-4000-8000-000000000831","expected_revision":2,"reason":"Cancel during checkout"}');raise exception 'Cancelled in flight';exception when serialization_failure then null;end;
end $$;
reset role;
set local role service_role;
do $$declare p jsonb:='{"invoice_id":"10000000-0000-4000-8000-000000000831","order_id":"PAYPALORDER1234567","capture_id":"PAYPALCAPTURE12345","amount_minor":12550,"currency":"USD","environment":"sandbox","event_id":"WH-1"}';begin
 perform public.payments_backend('paid',p);perform public.payments_backend('paid',p);
 if public.payments_backend('view',jsonb_build_object('token',current_setting('aup.test_token')))->>'status'<>'paid' then raise exception 'Payment not persisted';end if;
 perform public.payments_backend('review','{"capture_id":"PAYPALCAPTURE12345","event_id":"WH-REFUND","event_type":"PAYMENT.CAPTURE.REFUNDED"}');
 perform public.payments_backend('review','{"capture_id":"PAYPALCAPTURE12345","event_id":"WH-REFUND","event_type":"PAYMENT.CAPTURE.REFUNDED"}');
 if public.payments_backend('view',jsonb_build_object('token',current_setting('aup.test_token')))->>'payment_review'<>'PAYMENT.CAPTURE.REFUNDED' then raise exception 'Refund review missing';end if;
 perform public.payments_backend('paid',p);
end $$;
reset role;
do $$begin
 if (select count(*) from aup_private.invoice_events where invoice_id='10000000-0000-4000-8000-000000000831' and action='paypal_paid')<>1 then raise exception 'Duplicate paid event';end if;
 if (select count(*) from aup_private.invoice_events where invoice_id='10000000-0000-4000-8000-000000000831' and action='paypal_review')<>1 then raise exception 'Duplicate refund event';end if;
 if has_function_privilege('anon','public.payment_settings(text,jsonb)','execute') or has_function_privilege('authenticated','public.payments_backend(text,jsonb)','execute') then raise exception 'Unsafe function grants';end if;
end $$;
-- Quota counters and all fixture changes are restored by the final rollback.
delete from aup_private.payment_limits;
set local role service_role;
do $$declare result jsonb;i integer;before_rows integer;begin
 for i in 1..13 loop
  result:=public.payments_backend('quota',jsonb_build_object('token',current_setting('aup.test_token'),'operation','capture'));
  if (result->>'allowed')::boolean is distinct from (i<=12) then raise exception 'Provider quota failed at %',i;end if;
 end loop;
 if public.payments_backend('quota',jsonb_build_object('token',current_setting('aup.test_token'),'operation','view'))->>'allowed'<>'true' then raise exception 'Read blocked by provider quota';end if;
 for i in 1..61 loop
  result:=public.payments_backend('webhook_quota','{"environment":"sandbox"}');
  if (result->>'allowed')::boolean is distinct from (i<=60) then raise exception 'Webhook quota failed at %',i;end if;
 end loop;
 if public.payments_backend('webhook_quota','{"environment":"live"}')->>'allowed'<>'true' then raise exception 'Environment quotas mixed';end if;
 begin perform public.payments_backend('webhook_quota','{"environment":"unbounded-key"}');raise exception 'Arbitrary quota key';exception when invalid_parameter_value then null;end;
end $$;
reset role;
do $$declare n integer;begin
 if has_function_privilege('anon','aup_private.payments_backend_base(text,jsonb)','execute') or has_function_privilege('authenticated','aup_private.payments_backend_base(text,jsonb)','execute') or has_function_privilege('service_role','aup_private.payments_backend_base(text,jsonb)','execute') then raise exception 'Quota bypass grant';end if;
 select count(*) into n from aup_private.payment_limits;
 perform public.payments_backend('quota',jsonb_build_object('token',repeat('0',64),'operation','start'));
 if (select count(*) from aup_private.payment_limits)<>n then raise exception 'Unknown token grew quota keys';end if;
end $$;
rollback;
select 'passed: owner/admin/editor boundaries, encrypted credentials, exact amounts, one order/capture, refund replay, no public PII, bounded webhook/provider quotas and no quota bypass; all fixtures rolled back' as verification;
