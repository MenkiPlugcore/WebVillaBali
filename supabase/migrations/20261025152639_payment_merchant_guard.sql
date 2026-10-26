-- Keep merchant destinations under owner/developer control and preserve list order.
create or replace function aup_private.invoice_admin(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare inv aup_private.invoices%rowtype; cfg aup_private.payment_config%rowtype; actor text:=aup_private.current_staff_role(); result jsonb;
begin
 if auth.uid() is null or coalesce(actor,'') not in ('owner','admin','developer') then raise exception 'Akses invoice ditolak.' using errcode='42501';end if;
 if p_action='save' and actor='admin' and p_payload->>'payment_method'='bca' then
  perform pg_advisory_xact_lock(hashtextextended('aup-invoice:'||(p_payload->>'id'),0));
  select * into cfg from aup_private.payment_config where id;
  select * into inv from aup_private.invoices where id=(p_payload->>'id')::uuid for update;
  if not ((btrim(coalesce(p_payload->>'bca_account_name',''))=cfg.bca_account_name and coalesce(p_payload->>'bca_account_number','')=cfg.bca_account_number)
   or (inv.id is not null and inv.status='draft' and inv.payment_method='bca' and btrim(coalesce(p_payload->>'bca_account_name',''))=inv.bca_account_name and coalesce(p_payload->>'bca_account_number','')=inv.bca_account_number)) then
   raise exception 'Rekening tujuan hanya dapat ditentukan owner/developer melalui Metode pembayaran.' using errcode='42501';
  end if;
 end if;
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
  result:=jsonb_set(result,'{rows}',coalesce((select jsonb_agg(item||jsonb_build_object('payment_method',i.payment_method,'paypal_environment',i.paypal_environment,'payment_review',i.payment_review) order by x.position) from jsonb_array_elements(result->'rows') with ordinality x(item,position) join aup_private.invoices i on i.id=(item->>'id')::uuid),'[]'::jsonb));
 elsif result ? 'invoice' then
  result:=jsonb_set(result,'{invoice}',(result->'invoice')||jsonb_build_object('paypal_started',exists(select 1 from aup_private.paypal_attempts where invoice_id=(result->'invoice'->>'id')::uuid)));
 end if;
 return result||jsonb_build_object('settings',aup_private.payment_settings('get'));
end $$;
notify pgrst,'reload schema';
