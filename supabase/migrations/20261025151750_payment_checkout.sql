-- Credentials are encrypted by Vault; browser roles can only read the safe settings RPC.
create table aup_private.payment_config (
 id boolean primary key default true check(id),
 bca_account_name text not null default '', bca_account_number text not null default '',
 paypal_environment text not null default 'sandbox' check(paypal_environment in ('sandbox','live')),
 revision integer not null default 1,
 check(length(bca_account_name)<=120),check(bca_account_number='' or bca_account_number ~ '^[0-9]{6,20}$')
);
insert into aup_private.payment_config(id) values(true);
create table aup_private.payment_accounts (
 environment text primary key check(environment in ('sandbox','live')),
 client_id text not null,merchant_id text not null,webhook_id text not null,
 secret_id uuid not null references vault.secrets(id),connected boolean not null default true
);
create index payment_accounts_secret_idx on aup_private.payment_accounts(secret_id);
alter table aup_private.invoices add column checkout_token text not null default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),
 add column paypal_environment text check(paypal_environment in ('sandbox','live')),
 add column payment_review text not null default '';
create unique index invoices_checkout_token_idx on aup_private.invoices(checkout_token);
create table aup_private.paypal_attempts (
 invoice_id uuid primary key references aup_private.invoices(id),
 order_id text unique,create_request_id uuid not null default gen_random_uuid(),capture_request_id uuid not null default gen_random_uuid(),
 capture_id text unique,capturing boolean not null default false,created_at timestamptz not null default clock_timestamp()
);
create table aup_private.payment_webhooks (event_id text not null,invoice_id uuid not null references aup_private.invoices(id),created_at timestamptz not null default clock_timestamp(),primary key(event_id,invoice_id));
create index payment_webhooks_invoice_idx on aup_private.payment_webhooks(invoice_id);
create table aup_private.payment_limits (key text primary key,bucket timestamptz not null,hits integer not null);
do $$declare t text;begin
 foreach t in array array['payment_config','payment_accounts','paypal_attempts','payment_webhooks','payment_limits'] loop
  execute format('alter table aup_private.%I enable row level security',t);
  execute format('create policy no_client_access on aup_private.%I to anon,authenticated using(false) with check(false)',t);
  execute format('revoke all on aup_private.%I from public,anon,authenticated,service_role',t);
 end loop;
end $$;
alter table aup_private.invoice_events drop constraint invoice_events_action_check;
alter table aup_private.invoice_events add constraint invoice_events_action_check check(action in ('created','draft_saved','issued','cancelled','bca_confirmed','paypal_paid','paypal_review'));

create function aup_private.payment_settings(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor text:=aup_private.current_staff_role(); cfg aup_private.payment_config%rowtype; account aup_private.payment_accounts%rowtype;
begin
 if auth.uid() is null or coalesce(actor,'') not in ('owner','admin','developer') then raise exception 'Akses pembayaran ditolak.' using errcode='42501';end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or pg_column_size(p_payload)>2048 then raise exception 'Isian tidak valid.' using errcode='22023';end if;
 if p_action='save_bca' then
  if actor not in ('owner','developer') then raise exception 'Hanya owner/developer.' using errcode='42501';end if;
  if exists(select 1 from jsonb_object_keys(p_payload) k where k not in ('account_name','account_number'))
   or coalesce(length(btrim(p_payload->>'account_name')),0) not between 1 and 120 or coalesce(p_payload->>'account_number','') !~ '^[0-9]{6,20}$' then raise exception 'Periksa rekening BCA.' using errcode='22023';end if;
  update aup_private.payment_config set bca_account_name=btrim(p_payload->>'account_name'),bca_account_number=p_payload->>'account_number',revision=revision+1 where id;
  insert into public.staff_activity(actor_id,actor_role,session_id,table_name,record_key,action) values(auth.uid(),actor,auth.jwt()->>'session_id','payment_settings','bca','UPDATE');
 elsif p_action<>'get' then raise exception 'Aksi tidak diizinkan.' using errcode='22023';end if;
 select * into cfg from aup_private.payment_config where id;
 select * into account from aup_private.payment_accounts where environment=cfg.paypal_environment;
 return jsonb_build_object('bca_account_name',cfg.bca_account_name,'bca_account_number',cfg.bca_account_number,'paypal_environment',cfg.paypal_environment,
  'paypal_connected',coalesce(account.connected,false),'paypal_client_id',case when actor in ('owner','developer') then account.client_id end,
  'paypal_merchant_id',case when actor in ('owner','developer') then account.merchant_id end,'revision',cfg.revision,'can_manage',actor in ('owner','developer'),
  'paypal_locked',exists(select 1 from aup_private.invoices where payment_method='paypal' and status='issued' and paypal_environment=cfg.paypal_environment),
  'actor',jsonb_build_object('sub',auth.uid(),'session_id',auth.jwt()->>'session_id','aal','aal2','role','authenticated'));
end $$;
revoke all on function aup_private.payment_settings(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function aup_private.payment_settings(text,jsonb) to authenticated;
create function public.payment_settings(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select aup_private.payment_settings(p_action,p_payload);$$;
revoke all on function public.payment_settings(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.payment_settings(text,jsonb) to authenticated;

-- Retain the existing audited invoice operations and add the PayPal issue gate.
alter function aup_private.invoice_admin(text,jsonb) rename to invoice_admin_base;
revoke all on function aup_private.invoice_admin_base(text,jsonb) from public,anon,authenticated,service_role;
create function aup_private.invoice_admin(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare inv aup_private.invoices%rowtype; cfg aup_private.payment_config%rowtype; actor text:=aup_private.current_staff_role(); result jsonb;
begin
 if auth.uid() is null or coalesce(actor,'') not in ('owner','admin','developer') then raise exception 'Akses invoice ditolak.' using errcode='42501';end if;
 if p_action in ('issue','cancel') then
  perform pg_advisory_xact_lock(hashtextextended('aup-invoice:'||(p_payload->>'id'),0));
  select * into inv from aup_private.invoices where id=(p_payload->>'id')::uuid for update;
  if inv.payment_method='paypal' then
   if p_action='cancel' and exists(select 1 from aup_private.paypal_attempts where invoice_id=inv.id) then raise exception 'Pembayaran PayPal sudah dimulai. Periksa status sebelum membatalkan.' using errcode='40001';end if;
   if p_action='issue' then
    if exists(select 1 from jsonb_object_keys(p_payload) k where k not in ('id','expected_revision')) then raise exception 'Isian tidak diizinkan.' using errcode='22023';end if;
    if inv.status='issued' then return aup_private.invoice_admin_base('get',jsonb_build_object('id',inv.id))||jsonb_build_object('settings',aup_private.payment_settings('get'));end if;
    if inv.status<>'draft' or inv.revision<>coalesce((p_payload->>'expected_revision')::integer,0) then raise exception 'Invoice berubah.' using errcode='40001';end if;
    select * into cfg from aup_private.payment_config where id for update;
    if not exists(select 1 from aup_private.payment_accounts where environment=cfg.paypal_environment and connected) then raise exception 'Hubungkan akun PayPal terlebih dahulu.' using errcode='22023';end if;
    if inv.due_date<(timezone('Asia/Makassar',clock_timestamp()))::date or length(btrim(inv.terms))<10 then raise exception 'Lengkapi ketentuan dan jatuh tempo.' using errcode='22023';end if;
    update aup_private.invoices set status='issued',issued_at=clock_timestamp(),updated_at=clock_timestamp(),revision=revision+1,paypal_environment=cfg.paypal_environment where id=inv.id;
    insert into aup_private.invoice_events(invoice_id,action,actor_id,actor_role) values(inv.id,'issued',auth.uid(),actor);
    insert into public.staff_activity(actor_id,actor_role,session_id,table_name,record_key,action) values(auth.uid(),actor,auth.jwt()->>'session_id','invoices',inv.id::text,'UPDATE');
    return aup_private.invoice_admin_base('get',jsonb_build_object('id',inv.id))||jsonb_build_object('settings',aup_private.payment_settings('get'));
   end if;
  end if;
 end if;
 result:=aup_private.invoice_admin_base(p_action,p_payload);
 if p_action='list' then
  result:=jsonb_set(result,'{rows}',coalesce((select jsonb_agg(item||jsonb_build_object('payment_method',i.payment_method,'paypal_environment',i.paypal_environment,'payment_review',i.payment_review)) from jsonb_array_elements(result->'rows') item join aup_private.invoices i on i.id=(item->>'id')::uuid),'[]'::jsonb));
 elsif result ? 'invoice' then
  result:=jsonb_set(result,'{invoice}',(result->'invoice')||jsonb_build_object('paypal_started',exists(select 1 from aup_private.paypal_attempts where invoice_id=(result->'invoice'->>'id')::uuid)));
 end if;
 return result||jsonb_build_object('settings',aup_private.payment_settings('get'));
end $$;
revoke all on function aup_private.invoice_admin(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function aup_private.invoice_admin(text,jsonb) to authenticated;
create or replace function public.invoice_admin(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select aup_private.invoice_admin(p_action,p_payload);$$;

-- Only the Edge Function service identity may call this dispatcher. No client grants.
create function aup_private.payments_backend(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg aup_private.payment_config%rowtype; account aup_private.payment_accounts%rowtype; inv aup_private.invoices%rowtype; attempt aup_private.paypal_attempts%rowtype;
 old_claims text; actor text; secret_uuid uuid; secret_value text; n integer; bucket_now timestamptz:=date_trunc('minute',clock_timestamp());k text;wanted text;
begin
 if jsonb_typeof(p_payload) is distinct from 'object' or pg_column_size(p_payload)>8192 then raise exception 'Invalid input' using errcode='22023';end if;
 select * into cfg from aup_private.payment_config where id;
 if p_action='credentials' then
  select * into account from aup_private.payment_accounts where environment=coalesce(p_payload->>'environment',cfg.paypal_environment);
  if not found then return jsonb_build_object('connected',false);end if;
  select decrypted_secret into secret_value from vault.decrypted_secrets where id=account.secret_id;
  return jsonb_build_object('connected',account.connected,'environment',account.environment,'client_id',account.client_id,'merchant_id',account.merchant_id,'secret',secret_value,'webhook_id',account.webhook_id);
 elsif p_action='connect' then
  old_claims:=current_setting('request.jwt.claims',true);
  perform set_config('request.jwt.claims',(p_payload->'actor')::text,true);actor:=aup_private.current_staff_role();
  if auth.uid() is null or coalesce(actor,'') not in ('owner','developer') then raise exception 'Owner session required' using errcode='42501';end if;
  select * into cfg from aup_private.payment_config where id for update;
  wanted:=p_payload->>'environment';
  if wanted not in ('sandbox','live') or (coalesce(p_payload->>'client_id','') !~ '^[A-Za-z0-9_-]+$' or coalesce(length(p_payload->>'client_id'),0) not between 20 and 256) or coalesce(length(p_payload->>'secret'),0) not between 20 and 256
   or coalesce(p_payload->>'merchant_id','') !~ '^[A-Z0-9]{8,32}$' or coalesce(p_payload->>'webhook_id','') !~ '^[A-Z0-9-]{5,100}$' then raise exception 'Invalid credentials' using errcode='22023';end if;
  if cfg.revision<>coalesce((p_payload->>'expected_revision')::integer,0) or exists(select 1 from aup_private.invoices where status='issued' and payment_method='paypal' and paypal_environment=wanted) then raise exception 'Open invoices or changed settings' using errcode='40001';end if;
  select * into account from aup_private.payment_accounts where environment=wanted;
  if found and (account.client_id<>p_payload->>'client_id' or account.merchant_id<>p_payload->>'merchant_id') and exists(select 1 from aup_private.invoices where paypal_environment=wanted and status<>'draft') then raise exception 'Existing transactions belong to this merchant' using errcode='40001';end if;
  if account.secret_id is null then secret_uuid:=vault.create_secret(p_payload->>'secret','aup-paypal-'||wanted);
  else secret_uuid:=account.secret_id;perform vault.update_secret(secret_uuid,p_payload->>'secret');end if;
  insert into aup_private.payment_accounts(environment,client_id,merchant_id,webhook_id,secret_id) values(wanted,p_payload->>'client_id',p_payload->>'merchant_id',p_payload->>'webhook_id',secret_uuid)
   on conflict(environment) do update set client_id=excluded.client_id,merchant_id=excluded.merchant_id,webhook_id=excluded.webhook_id,secret_id=excluded.secret_id,connected=true;
  update aup_private.payment_config set paypal_environment=wanted,revision=revision+1 where id;
  insert into public.staff_activity(actor_id,actor_role,session_id,table_name,record_key,action) values(auth.uid(),actor,auth.jwt()->>'session_id','payment_settings',wanted,'UPDATE');
  perform set_config('request.jwt.claims',coalesce(old_claims,''),true);return '{}'::jsonb;
 elsif p_action='quota' then
  insert into aup_private.payment_limits values('global',bucket_now,1) on conflict(key) do update set bucket=excluded.bucket,hits=case when payment_limits.bucket=excluded.bucket then payment_limits.hits+1 else 1 end returning hits into n;
  if n>300 then return '{"allowed":false}'::jsonb;end if;
  select id into inv.id from aup_private.invoices where checkout_token=p_payload->>'token' and status in ('issued','paid');
  if not found then return '{"allowed":false,"missing":true}'::jsonb;end if;
  k:=inv.id::text;
  insert into aup_private.payment_limits values(k,bucket_now,1) on conflict(key) do update set bucket=excluded.bucket,hits=case when payment_limits.bucket=excluded.bucket then payment_limits.hits+1 else 1 end returning hits into n;
  return jsonb_build_object('allowed',n<=40);
 elsif p_action='review' then
  select i.* into inv from aup_private.invoices i join aup_private.paypal_attempts a on a.invoice_id=i.id where a.capture_id=p_payload->>'capture_id' for update of i;
  if not found then return '{}'::jsonb;end if;
  if coalesce(p_payload->>'event_type','') not in ('PAYMENT.CAPTURE.REFUNDED','PAYMENT.CAPTURE.REVERSED','CUSTOMER.DISPUTE.CREATED','CUSTOMER.DISPUTE.RESOLVED') then raise exception 'Invalid event' using errcode='22023';end if;
  insert into aup_private.payment_webhooks(event_id,invoice_id) values(p_payload->>'event_id',inv.id) on conflict do nothing;
  if found then
   update aup_private.invoices set payment_review=p_payload->>'event_type',revision=revision+1,updated_at=clock_timestamp() where id=inv.id;
   insert into aup_private.invoice_events(invoice_id,action,actor_role,details) values(inv.id,'paypal_review','paypal',jsonb_build_object('type',p_payload->>'event_type'));
  end if;
  return '{}'::jsonb;
 end if;
 if p_action='order' then
  select i.* into inv from aup_private.invoices i join aup_private.paypal_attempts a on a.invoice_id=i.id where a.order_id=p_payload->>'order_id';
  if not found then return null;end if;
 elsif p_action in ('view','begin') then
  select * into inv from aup_private.invoices where checkout_token=p_payload->>'token' and status in ('issued','paid') for update;
 else select * into inv from aup_private.invoices where id=(p_payload->>'invoice_id')::uuid for update;end if;
 if inv.id is null then raise exception 'Missing invoice' using errcode='P0002';end if;
 if p_action='view' then
  return jsonb_build_object('invoice_no',inv.invoice_no,'summary',inv.summary,'amount_minor',inv.amount_minor,'currency',inv.currency,'status',inv.status,'due_date',inv.due_date,'terms',inv.terms,'notes',inv.notes,'language',inv.customer_language,
   'payment_method',inv.payment_method,'paypal_environment',inv.paypal_environment,'payment_review',inv.payment_review,'bca_account_name',inv.bca_account_name,'bca_account_number',inv.bca_account_number,
   'expired',inv.due_date<(timezone('Asia/Makassar',clock_timestamp()))::date);
 end if;
 if inv.payment_method<>'paypal' or inv.currency<>'USD' or inv.status not in ('issued','paid') then raise exception 'Invoice not payable' using errcode='22023';end if;
 if inv.payment_review<>'' and p_action in ('begin','bind','capture_begin') then raise exception 'Payment under review' using errcode='40001';end if;
 if p_action='begin' then
  if inv.status='paid' then return jsonb_build_object('status','paid');end if;
  if not exists(select 1 from aup_private.paypal_attempts where invoice_id=inv.id) and inv.due_date<(timezone('Asia/Makassar',clock_timestamp()))::date then raise exception 'Past due date' using errcode='22023';end if;
  insert into aup_private.paypal_attempts(invoice_id) values(inv.id) on conflict do nothing;
 elsif p_action='bind' then
  if coalesce(p_payload->>'order_id','') !~ '^[A-Z0-9]{10,32}$' then raise exception 'Invalid order' using errcode='22023';end if;
  update aup_private.paypal_attempts set order_id=p_payload->>'order_id' where invoice_id=inv.id and (order_id is null or order_id=p_payload->>'order_id');
  if not found then raise exception 'Different order already bound' using errcode='40001';end if;
 elsif p_action='capture_begin' then
  update aup_private.paypal_attempts set capturing=true where invoice_id=inv.id and order_id=p_payload->>'order_id';
  if not found then raise exception 'Wrong order' using errcode='22023';end if;
 elsif p_action='paid' then
  select * into attempt from aup_private.paypal_attempts where invoice_id=inv.id for update;
  if attempt.order_id is distinct from p_payload->>'order_id' or inv.amount_minor is distinct from (p_payload->>'amount_minor')::bigint or p_payload->>'currency' is distinct from 'USD' or inv.paypal_environment is distinct from p_payload->>'environment'
   or coalesce(p_payload->>'capture_id','') !~ '^[A-Z0-9]{10,32}$' then raise exception 'Capture mismatch' using errcode='22023';end if;
  if inv.status='paid' then
   if attempt.capture_id is distinct from p_payload->>'capture_id' then raise exception 'Different capture' using errcode='40001';end if;
  else
   update aup_private.paypal_attempts set capture_id=p_payload->>'capture_id' where invoice_id=inv.id;
   update aup_private.invoices set status='paid',paid_at=clock_timestamp(),payment_reference=p_payload->>'capture_id',revision=revision+1,updated_at=clock_timestamp() where id=inv.id returning * into inv;
   insert into aup_private.invoice_events(invoice_id,action,actor_role,details) values(inv.id,'paypal_paid','paypal',jsonb_build_object('capture_id',p_payload->>'capture_id','environment',inv.paypal_environment));
  end if;
  insert into aup_private.payment_webhooks(event_id,invoice_id) values(p_payload->>'event_id',inv.id) on conflict do nothing;
 elsif p_action<>'order' then raise exception 'Invalid action' using errcode='22023';end if;
 select * into attempt from aup_private.paypal_attempts where invoice_id=inv.id;
 return to_jsonb(inv)||jsonb_build_object('order_id',attempt.order_id,'create_request_id',attempt.create_request_id,'capture_request_id',attempt.capture_request_id,'attempt_created_at',attempt.created_at);
end $$;
revoke all on function aup_private.payments_backend(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function aup_private.payments_backend(text,jsonb) to service_role;
grant usage on schema aup_private to service_role;
create function public.payments_backend(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select aup_private.payments_backend(p_action,p_payload);$$;
revoke all on function public.payments_backend(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.payments_backend(text,jsonb) to service_role;
notify pgrst,'reload schema';
