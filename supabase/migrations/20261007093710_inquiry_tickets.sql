create sequence aup_private.ticket_number_seq start 100001;
grant usage on sequence aup_private.ticket_number_seq to service_role;
alter table public.inquiries add column ticket_no text not null default ('AUP-' || nextval('aup_private.ticket_number_seq')::text) unique;
create function aup_private.keep_ticket_number() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.ticket_no is distinct from old.ticket_no then raise exception 'Ticket number cannot change' using errcode='23514'; end if;
 return new;
end $$;
create trigger immutable_ticket_number before update on public.inquiries for each row execute function aup_private.keep_ticket_number();
create or replace function public.submit_inquiry(p_request_id uuid,p_contact_hash text,p_data jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  previous aup_private.inquiry_requests%rowtype;
  data_hash text:=md5(p_data::text);
  window_at timestamptz:=to_timestamp(floor(extract(epoch from now())/600)*600);
  day_at timestamptz:=date_trunc('day',now(),'UTC');
  count_after integer;
  inquiry uuid;
begin
  if p_request_id is null or p_contact_hash !~ '^[a-f0-9]{64}$' or p_contact_hash is null or jsonb_typeof(p_data)<>'object' then
    return jsonb_build_object('status',400);
  end if;
  -- Retries serialize by request id, including concurrent requests across Edge isolates.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  select * into previous from aup_private.inquiry_requests where request_id=p_request_id;
  if found then
    if previous.payload_hash=data_hash and previous.contact_hash=p_contact_hash then
      return jsonb_build_object('status',200,'ticket_no',(select ticket_no from public.inquiries where id=previous.inquiry_id));
    end if;
    return jsonb_build_object('status',409);
  end if;
  -- Reference checks and insert share a transaction. No inquiries about unpublished records.
  if (p_data->>'inquiry_type')='property' and not exists(select 1 from public.properties where id=(p_data->>'property_id')::uuid and publication_status='published') then
    return jsonb_build_object('status',404);
  end if;
  if (p_data->>'inquiry_type')='motorbike' and not exists(select 1 from public.motorbikes where id=(p_data->>'motorbike_id')::uuid and publication_status='published' and availability='available') then
    return jsonb_build_object('status',404);
  end if;
  -- Serialize each contact's quotas. Store only server HMACs, never raw contact/IP here.
  perform pg_advisory_xact_lock(hashtextextended(p_contact_hash,1));
  select hits into count_after from aup_private.inquiry_limits where key='contact10:'||p_contact_hash and window_start=window_at;
  if coalesce(count_after,0)>=3 then return jsonb_build_object('status',429);end if;
  select hits into count_after from aup_private.inquiry_limits where key='contactday:'||p_contact_hash and window_start=day_at;
  if coalesce(count_after,0)>=10 then return jsonb_build_object('status',429);end if;
  -- Atomic shared ceiling also limits submissions from rotating contact addresses.
  insert into aup_private.inquiry_limits(key,window_start,hits) values ('global',window_at,1)
  on conflict(key,window_start) do update set hits=aup_private.inquiry_limits.hits+1 where aup_private.inquiry_limits.hits<200
  returning hits into count_after;
  if count_after is null then return jsonb_build_object('status',429);end if;
  insert into aup_private.inquiry_limits(key,window_start,hits) values ('contact10:'||p_contact_hash,window_at,1),('contactday:'||p_contact_hash,day_at,1)
  on conflict(key,window_start) do update set hits=aup_private.inquiry_limits.hits+1;
  insert into public.inquiries(inquiry_type,property_id,motorbike_id,name,email,phone,message,language)
  values(p_data->>'inquiry_type',nullif(p_data->>'property_id','')::uuid,nullif(p_data->>'motorbike_id','')::uuid,
    p_data->>'name',nullif(p_data->>'email',''),nullif(p_data->>'phone',''),p_data->>'message',p_data->>'language') returning id into inquiry;
  insert into aup_private.inquiry_requests(request_id,payload_hash,contact_hash,inquiry_id) values(p_request_id,data_hash,p_contact_hash,inquiry);
  delete from aup_private.inquiry_limits where window_start<now()-interval '2 days';
  delete from aup_private.inquiry_requests where created_at<now()-interval '2 days';
  return jsonb_build_object('status',200,'ticket_no',(select ticket_no from public.inquiries where id=inquiry));
end;
$$;
revoke all on function public.submit_inquiry(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_inquiry(uuid,text,jsonb) to service_role;
