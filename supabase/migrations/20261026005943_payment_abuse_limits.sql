-- Keep the existing settlement logic, with bounded pre-verification/provider work.
alter function aup_private.payments_backend(text,jsonb) rename to payments_backend_base;
revoke all on function aup_private.payments_backend_base(text,jsonb) from public,anon,authenticated,service_role;

create function aup_private.payments_backend(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; inv_id uuid; k text; n integer; cap integer;
 minute_now timestamptz:=date_trunc('minute',clock_timestamp());
begin
 if jsonb_typeof(p_payload) is distinct from 'object' or pg_column_size(p_payload)>8192 then raise exception 'Invalid input' using errcode='22023';end if;
 if p_action='webhook_quota' then
  if coalesce(p_payload->>'environment','') not in ('sandbox','live') then raise exception 'Invalid environment' using errcode='22023';end if;
  k:='webhook:'||(p_payload->>'environment');
  insert into aup_private.payment_limits values(k,minute_now,1)
   on conflict(key) do update set bucket=excluded.bucket,hits=case when payment_limits.bucket=excluded.bucket then least(payment_limits.hits,60)+1 else 1 end returning hits into n;
  return jsonb_build_object('allowed',n<=60);
 elsif p_action='quota' then
  if coalesce(p_payload->>'operation','view') not in ('view','start','capture') then raise exception 'Invalid operation' using errcode='22023';end if;
  result:=aup_private.payments_backend_base(p_action,p_payload);
  if result->>'allowed' is distinct from 'true' or coalesce(p_payload->>'operation','view')='view' then return result;end if;
  select id into inv_id from aup_private.invoices where checkout_token=p_payload->>'token' and status in ('issued','paid');
  if inv_id is null then return '{"allowed":false,"missing":true}'::jsonb;end if;
  foreach k in array array['provider:global','provider:'||inv_id::text] loop
   cap:=case when k='provider:global' then 120 else 12 end;
   insert into aup_private.payment_limits values(k,minute_now,1)
    on conflict(key) do update set bucket=excluded.bucket,hits=case when payment_limits.bucket=excluded.bucket then least(payment_limits.hits,cap)+1 else 1 end returning hits into n;
   if n>cap then return '{"allowed":false}'::jsonb;end if;
  end loop;
  return result;
 end if;
 return aup_private.payments_backend_base(p_action,p_payload);
end $$;
revoke all on function aup_private.payments_backend(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function aup_private.payments_backend(text,jsonb) to service_role;
notify pgrst,'reload schema';
