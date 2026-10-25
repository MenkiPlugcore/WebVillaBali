-- Private invoice records; all business actions pass the existing live-role/MFA gate.
create sequence aup_private.invoice_number_seq start 100001;
create table aup_private.invoices (
 id uuid primary key,
 invoice_no text not null unique default ('AUP-INV-' || nextval('aup_private.invoice_number_seq')::text),
 inquiry_id uuid not null references public.inquiries(id) on delete restrict,
 ticket_no text not null,
 customer_name text not null,
 customer_email text,
 customer_phone text,
 customer_language text not null check (customer_language in ('id','en')),
 summary text not null check (length(btrim(summary)) between 1 and 500),
 payment_kind text not null check (payment_kind in ('deposit','balance','full','other')),
 payment_method text not null check (payment_method in ('bca','paypal')),
 currency text not null check (currency in ('IDR','USD')),
 amount_minor bigint not null check (amount_minor between 1 and 9000000000000),
 due_date date not null,
 notes text not null default '' check (length(notes)<=2000),
 terms text not null default '' check (length(terms)<=2000),
 bca_account_name text not null default '' check (length(bca_account_name)<=120),
 bca_account_number text not null default '' check (bca_account_number='' or bca_account_number ~ '^[0-9]{6,20}$'),
 status text not null default 'draft' check (status in ('draft','issued','paid','cancelled')),
 revision integer not null default 1 check (revision>0),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 issued_at timestamptz,
 paid_at timestamptz,
 payment_reference text,
 verified_by uuid references auth.users(id) on delete set null,
 cancellation_reason text,
 check ((payment_method='bca' and currency='IDR') or (payment_method='paypal' and currency='USD')),
 check (status not in ('issued','paid') or (issued_at is not null and length(btrim(terms))>=10)),
 check (status<>'paid' or (paid_at is not null and payment_reference is not null and length(btrim(payment_reference)) between 3 and 120)),
 check (status<>'cancelled' or (cancellation_reason is not null and length(btrim(cancellation_reason)) between 3 and 500))
);
create index invoices_inquiry_idx on aup_private.invoices(inquiry_id);
create index invoices_creator_idx on aup_private.invoices(created_by);
create index invoices_verifier_idx on aup_private.invoices(verified_by);
create index invoices_created_idx on aup_private.invoices(created_at desc,id);
create index invoices_outstanding_idx on aup_private.invoices(due_date) where status='issued';
create unique index invoices_bca_reference_unique on aup_private.invoices(bca_account_number,lower(payment_reference)) where status='paid' and payment_method='bca';
create table aup_private.invoice_events (
 id uuid primary key default gen_random_uuid(),
 invoice_id uuid not null references aup_private.invoices(id) on delete restrict,
 action text not null check (action in ('created','draft_saved','issued','cancelled','bca_confirmed')),
 actor_id uuid references auth.users(id) on delete set null,
 actor_role text not null,
 occurred_at timestamptz not null default clock_timestamp(),
 details jsonb not null default '{}'::jsonb
);
create index invoice_events_invoice_idx on aup_private.invoice_events(invoice_id,occurred_at desc);
create index invoice_events_actor_idx on aup_private.invoice_events(actor_id);
alter table aup_private.invoices enable row level security;
alter table aup_private.invoice_events enable row level security;
create policy invoices_rpc_only on aup_private.invoices to anon,authenticated using(false) with check(false);
create policy invoice_events_rpc_only on aup_private.invoice_events to anon,authenticated using(false) with check(false);
revoke all on aup_private.invoices,aup_private.invoice_events from public,anon,authenticated,service_role;
revoke all on sequence aup_private.invoice_number_seq from public,anon,authenticated,service_role;

create function aup_private.invoice_admin(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare
 actor text; allowed text[]; inv aup_private.invoices%rowtype; ticket public.inquiries%rowtype;
 item_id uuid; expected integer; current_page integer; term text; wanted text; result jsonb;
 event_action text; creating boolean; same_draft boolean; amount bigint; deadline date;
 today date := (timezone('Asia/Makassar',clock_timestamp()))::date;
begin
 actor:=aup_private.current_staff_role();
 if auth.uid() is null or coalesce(actor,'') not in ('owner','admin','developer') then
  raise exception 'Invoice hanya tersedia untuk owner/admin/developer dengan MFA dan sesi aktif.' using errcode='42501';
 end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or pg_column_size(p_payload)>16384 then
  raise exception 'Isian invoice tidak valid atau terlalu panjang.' using errcode='22023';
 end if;
 allowed:=case p_action
  when 'list' then array['search','status','page'] when 'tickets' then array['search','id'] when 'get' then array['id']
  when 'save' then array['id','expected_revision','inquiry_id','summary','payment_kind','payment_method','currency','amount_minor','due_date','notes','terms','bca_account_name','bca_account_number']
  when 'issue' then array['id','expected_revision'] when 'cancel' then array['id','expected_revision','reason']
  when 'confirm_bca' then array['id','expected_revision','reference','amount_minor','currency','verified'] end;
 if allowed is null or exists(select 1 from jsonb_object_keys(p_payload) k where not k=any(allowed)) then
  raise exception 'Aksi atau isian invoice tidak diizinkan.' using errcode='22023';
 end if;
 if p_action in ('list','tickets') then
  term:=btrim(coalesce(p_payload->>'search',''));wanted:=coalesce(p_payload->>'status','');
  if length(term)>100 or wanted not in ('','draft','issued','paid','cancelled','overdue') then raise exception 'Filter tidak valid.' using errcode='22023';end if;
  if p_action='tickets' then
   return jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(t)) from (
    select i.id,i.ticket_no,i.name from public.inquiries i where i.status<>'spam'
    and (p_payload->>'id' is null or i.id=(p_payload->>'id')::uuid)
    and (term='' or strpos(lower(i.ticket_no||' '||i.name),lower(term))>0)
    order by i.created_at desc,i.id limit 20
   ) t),'[]'::jsonb));
  end if;
  current_page:=coalesce((p_payload->>'page')::integer,0);
  if current_page not between 0 and 10000 then raise exception 'Halaman tidak valid.' using errcode='22023';end if;
  with filtered as (
   select i.id,i.invoice_no,i.ticket_no,i.customer_name,i.summary,i.amount_minor,i.currency,i.status,i.due_date,i.created_at,i.revision,
    i.status='issued' and i.due_date<today as is_overdue from aup_private.invoices i
   where (term='' or strpos(lower(i.invoice_no||' '||i.ticket_no||' '||i.customer_name),lower(term))>0)
    and (wanted='' or i.status=wanted or (wanted='overdue' and i.status='issued' and i.due_date<today))
  ) select jsonb_build_object('total',(select count(*) from filtered),'page',current_page,'rows',coalesce((select jsonb_agg(to_jsonb(t)) from (
   select * from filtered order by created_at desc,id limit 20 offset current_page*20
  ) t),'[]'::jsonb)) into result;
  return result;
 end if;
 item_id:=(p_payload->>'id')::uuid;
 if item_id is null then raise exception 'Pilih invoice.' using errcode='22023';end if;
 if p_action='get' then
  select * into inv from aup_private.invoices where id=item_id;
  if not found then raise exception 'Invoice tidak ditemukan.' using errcode='P0002';end if;
 else
  -- Serialize new UUIDs as well as updates; retries cannot create duplicate invoices.
  perform pg_advisory_xact_lock(hashtextextended('aup-invoice:'||item_id::text,0));
  select * into inv from aup_private.invoices where id=item_id for update;
  creating:=not found;
  expected:=coalesce((p_payload->>'expected_revision')::integer,0);
  if creating and p_action<>'save' then raise exception 'Invoice tidak ditemukan.' using errcode='P0002';end if;
  if p_action='save' then
   if jsonb_typeof(p_payload->'amount_minor') is distinct from 'number' or (p_payload->>'amount_minor') !~ '^[0-9]+$' then
    raise exception 'Nominal harus berupa satuan mata uang yang valid.' using errcode='22023';end if;
   amount:=(p_payload->>'amount_minor')::bigint;
   if amount not between 1 and 9000000000000 or coalesce(length(btrim(p_payload->>'summary')),0) not between 1 and 500
    or coalesce(p_payload->>'payment_kind','') not in ('deposit','balance','full','other')
    or coalesce(p_payload->>'payment_method','') not in ('bca','paypal')
    or not ((p_payload->>'payment_method'='bca' and p_payload->>'currency'='IDR') or (p_payload->>'payment_method'='paypal' and p_payload->>'currency'='USD'))
    or coalesce(p_payload->>'due_date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or length(coalesce(p_payload->>'notes',''))>2000 or length(coalesce(p_payload->>'terms',''))>2000
    or length(coalesce(p_payload->>'bca_account_name',''))>120
    or coalesce(p_payload->>'bca_account_number','') !~ '^([0-9]{6,20})?$' then
    raise exception 'Periksa deskripsi, nominal, rekening, dan mata uang invoice.' using errcode='22023';end if;
   deadline:=(p_payload->>'due_date')::date;
   if creating then
    if expected<>0 then raise exception 'Invoice berubah. Muat ulang sebelum melanjutkan.' using errcode='40001';end if;
    select * into ticket from public.inquiries where id=(p_payload->>'inquiry_id')::uuid and status<>'spam';
    if not found then raise exception 'Pilih tiket pelanggan yang aktif.' using errcode='22023';end if;
    insert into aup_private.invoices(id,inquiry_id,ticket_no,customer_name,customer_email,customer_phone,customer_language,
     summary,payment_kind,payment_method,currency,amount_minor,due_date,notes,terms,bca_account_name,bca_account_number,created_by)
    values(item_id,ticket.id,ticket.ticket_no,ticket.name,ticket.email,ticket.phone,ticket.language,
     btrim(p_payload->>'summary'),p_payload->>'payment_kind',p_payload->>'payment_method',p_payload->>'currency',amount,deadline,
     btrim(coalesce(p_payload->>'notes','')),btrim(coalesce(p_payload->>'terms','')),btrim(coalesce(p_payload->>'bca_account_name','')),coalesce(p_payload->>'bca_account_number',''),auth.uid()) returning * into inv;
    event_action:='created';
   else
    if inv.status<>'draft' then raise exception 'Rincian invoice yang sudah diterbitkan tidak dapat diubah.' using errcode='22023';end if;
    if inv.inquiry_id is distinct from (p_payload->>'inquiry_id')::uuid then raise exception 'Tiket invoice tidak dapat diganti.' using errcode='22023';end if;
    same_draft:=inv.summary=btrim(p_payload->>'summary') and inv.payment_kind=p_payload->>'payment_kind' and inv.payment_method=p_payload->>'payment_method'
     and inv.currency=p_payload->>'currency' and inv.amount_minor=amount and inv.due_date=deadline
     and inv.notes=btrim(coalesce(p_payload->>'notes','')) and inv.terms=btrim(coalesce(p_payload->>'terms',''))
     and inv.bca_account_name=btrim(coalesce(p_payload->>'bca_account_name','')) and inv.bca_account_number=coalesce(p_payload->>'bca_account_number','');
    if not same_draft then
     if expected<>inv.revision then raise exception 'Invoice berubah. Isianmu tetap di layar; muat ulang sebelum melanjutkan.' using errcode='40001';end if;
     update aup_private.invoices set summary=btrim(p_payload->>'summary'),payment_kind=p_payload->>'payment_kind',payment_method=p_payload->>'payment_method',
      currency=p_payload->>'currency',amount_minor=amount,due_date=deadline,notes=btrim(coalesce(p_payload->>'notes','')),terms=btrim(coalesce(p_payload->>'terms','')),
      bca_account_name=btrim(coalesce(p_payload->>'bca_account_name','')),bca_account_number=coalesce(p_payload->>'bca_account_number',''),
      revision=revision+1,updated_at=clock_timestamp() where id=item_id returning * into inv;
     event_action:='draft_saved';
    end if;
   end if;
  elsif p_action='issue' then
   if inv.status<>'issued' then
    if inv.status<>'draft' or inv.revision<>expected then raise exception 'Status invoice berubah. Muat ulang sebelum menerbitkan.' using errcode='40001';end if;
    if inv.payment_method='paypal' then raise exception 'Akun pembayaran PayPal belum tersambung. Invoice ini dapat disimpan sebagai draft.' using errcode='22023';end if;
    if inv.due_date<today or length(btrim(inv.terms))<10 or inv.bca_account_name='' or inv.bca_account_number='' then
     raise exception 'Lengkapi rekening BCA, ketentuan pembayaran, dan jatuh tempo sebelum menerbitkan.' using errcode='22023';end if;
    update aup_private.invoices set status='issued',issued_at=clock_timestamp(),updated_at=clock_timestamp(),revision=revision+1 where id=item_id returning * into inv;
    event_action:='issued';
   end if;
  elsif p_action='cancel' then
   if length(btrim(coalesce(p_payload->>'reason',''))) not between 3 and 500 then raise exception 'Isi alasan pembatalan (3–500 karakter).' using errcode='22023';end if;
   if inv.status<>'cancelled' then
    if inv.status not in ('draft','issued') or inv.revision<>expected then raise exception 'Invoice sudah dibayar atau berubah. Muat ulang sebelum membatalkan.' using errcode='40001';end if;
    update aup_private.invoices set status='cancelled',cancellation_reason=btrim(p_payload->>'reason'),updated_at=clock_timestamp(),revision=revision+1 where id=item_id returning * into inv;
    event_action:='cancelled';
   end if;
  elsif p_action='confirm_bca' then
   if inv.payment_method<>'bca' or p_payload->'verified' is distinct from 'true'::jsonb
    or jsonb_typeof(p_payload->'amount_minor') is distinct from 'number' or (p_payload->>'amount_minor')::numeric<>inv.amount_minor
    or p_payload->>'currency' is distinct from inv.currency
    or length(btrim(coalesce(p_payload->>'reference',''))) not between 3 and 120 then
    raise exception 'Cocokkan dana masuk, nominal, mata uang, dan referensi mutasi BCA.' using errcode='22023';end if;
   if inv.status='paid' and inv.payment_reference=btrim(p_payload->>'reference') then null;
   else
    if inv.status<>'issued' or inv.revision<>expected then raise exception 'Invoice belum diterbitkan, sudah dibayar, dibatalkan, atau berubah.' using errcode='40001';end if;
    update aup_private.invoices set status='paid',paid_at=clock_timestamp(),verified_by=auth.uid(),payment_reference=btrim(p_payload->>'reference'),
     updated_at=clock_timestamp(),revision=revision+1 where id=item_id returning * into inv;
    event_action:='bca_confirmed';
   end if;
  end if;
  if event_action is not null then
   insert into aup_private.invoice_events(invoice_id,action,actor_id,actor_role,details)
   values(item_id,event_action,auth.uid(),actor,jsonb_build_object('revision',inv.revision,'amount_minor',inv.amount_minor,'currency',inv.currency));
   insert into public.staff_activity(actor_id,actor_role,session_id,table_name,record_key,action)
   values(auth.uid(),actor,auth.jwt()->>'session_id','invoices',item_id::text,case when event_action='created' then 'INSERT' else 'UPDATE' end);
  end if;
 end if;
 return jsonb_build_object('invoice',to_jsonb(inv),'events',coalesce((select jsonb_agg(to_jsonb(e)) from (
  select action,actor_role,occurred_at,details from aup_private.invoice_events where invoice_id=item_id order by occurred_at desc,id limit 100
 ) e),'[]'::jsonb));
end;
$fn$;
revoke all on function aup_private.invoice_admin(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function aup_private.invoice_admin(text,jsonb) to authenticated;
create function public.invoice_admin(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $fn$
 select aup_private.invoice_admin(p_action,p_payload);
$fn$;
revoke all on function public.invoice_admin(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.invoice_admin(text,jsonb) to authenticated;
notify pgrst,'reload schema';
