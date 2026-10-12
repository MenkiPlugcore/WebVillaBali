-- Dedicated developer role: same business capabilities, explicit revocable grant.
create table public.developer_grants(
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 expires_at timestamptz,
 updated_at timestamptz not null default now(),
 updated_by uuid
);
alter table public.developer_grants enable row level security;
revoke all on public.developer_grants from public,anon,authenticated;
grant select on public.developer_grants to authenticated;
grant all on public.developer_grants to service_role;

create or replace function aup_private.current_staff_role() returns text
language sql stable security definer set search_path = '' as $$
 select u.raw_app_meta_data->>'aup_role'
 from auth.users u join auth.sessions s on s.user_id=u.id
 where u.id=(select auth.uid())
 and s.id::text=(select auth.jwt()->>'session_id')
 and (select auth.jwt()->>'aal')='aal2' and s.aal::text='aal2'
 and exists(select 1 from auth.mfa_factors f where f.user_id=u.id and f.status::text='verified' and f.factor_type::text='totp')
 and (s.not_after is null or s.not_after>pg_catalog.now())
 and u.deleted_at is null
 and (u.banned_until is null or u.banned_until<=pg_catalog.now())
 and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false'
 and u.raw_app_meta_data->>'aup_role' in ('owner','admin','editor','developer')
 and (u.raw_app_meta_data->>'aup_role'<>'developer' or exists(
   select 1 from public.developer_grants g where g.user_id=u.id and g.enabled and (g.expires_at is null or g.expires_at>pg_catalog.now())))
 limit 1;
$$;
revoke all on function aup_private.current_staff_role() from public;
grant execute on function aup_private.current_staff_role() to anon,authenticated,service_role;
create or replace function aup_private.is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
 select coalesce((select aup_private.current_staff_role()) in ('owner','admin','developer'),false);
$$;
create or replace function aup_private.can_edit_content() returns boolean
language sql stable security invoker set search_path = '' as $$
 select coalesce((select aup_private.current_staff_role()) in ('owner','admin','editor','developer'),false);
$$;
create or replace function public.developer_access() returns boolean
language sql stable security invoker set search_path = '' as $$
 select coalesce((select aup_private.current_staff_role())='developer',false);
$$;
revoke all on function public.developer_access() from public,anon;
grant execute on function public.developer_access() to authenticated,service_role;
create policy own_or_owner_read on public.developer_grants for select to authenticated
using ((select aup_private.current_staff_role())='owner' or ((select aup_private.current_staff_role())='developer' and user_id=(select auth.uid())));

-- Append-only metadata, never record snapshots or customer message contents.
create table public.staff_activity(
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null,
 actor_role text not null,
 session_id text,
 table_name text not null,
 record_key text not null,
 action text not null check(action in ('INSERT','UPDATE','DELETE')),
 created_at timestamptz not null default now()
);
create index staff_activity_time on public.staff_activity(created_at desc,id);
create index staff_activity_actor_time on public.staff_activity(actor_id,created_at desc);
alter table public.staff_activity enable row level security;
revoke all on public.staff_activity from public,anon,authenticated,service_role;
grant select on public.staff_activity to authenticated,service_role;
create policy owner_or_own_developer_activity on public.staff_activity for select to authenticated
using ((select aup_private.current_staff_role())='owner' or ((select aup_private.current_staff_role())='developer' and actor_id=(select auth.uid())));

create function aup_private.record_staff_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare staff text; item jsonb;
begin
 staff:=aup_private.current_staff_role();
 if staff is not null then
  item:=case when TG_OP='DELETE' then to_jsonb(OLD) else to_jsonb(NEW) end;
  insert into public.staff_activity(actor_id,actor_role,session_id,table_name,record_key,action)
  values(auth.uid(),staff,auth.jwt()->>'session_id',TG_TABLE_NAME,
   coalesce(item->>'id',item->>'key',item->>'user_id','unknown'),TG_OP);
 end if;
 if TG_OP='DELETE' then return OLD;else return NEW;end if;
end;
$$;
revoke all on function aup_private.record_staff_activity() from public,anon,authenticated,service_role;
do $$declare tbl text;begin
 foreach tbl in array array['properties','property_images','locations','motorbikes','motorbike_images','services','testimonials','guest_moments','site_settings','inquiries','developer_grants'] loop
 execute format('create trigger staff_activity_record after insert or update or delete on public.%I for each row execute function aup_private.record_staff_activity()',tbl);
 end loop;
end $$;

-- Only the current owner may manage an existing developer's grant.
-- Cannot create users, change roles, grant owner, or bypass MFA.
create function aup_private.manage_developer_access(p_user_id uuid default null,p_enabled boolean default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 if coalesce(aup_private.current_staff_role(),'')<>'owner' then raise exception 'Hanya owner yang dapat mengatur akses developer.' using errcode='42501';end if;
 if p_user_id is null and p_enabled is not null then raise exception 'Pilih akun developer.' using errcode='22023';end if;
 if p_user_id is not null then
  if p_enabled is null then raise exception 'Status akses wajib diisi.' using errcode='22023';end if;
  perform id from auth.users where id=p_user_id and raw_app_meta_data->>'aup_role'='developer' and deleted_at is null for update;
  if not found then raise exception 'Akun developer tidak ditemukan.' using errcode='22023';end if;
  insert into public.developer_grants(user_id,enabled,expires_at,updated_at,updated_by)
  values(p_user_id,p_enabled,null,now(),auth.uid())
  on conflict(user_id) do update set enabled=excluded.enabled,expires_at=null,updated_at=excluded.updated_at,updated_by=excluded.updated_by;
 end if;
 select coalesce(jsonb_agg(to_jsonb(r) order by r.email),'[]'::jsonb) into result from (
  select u.id as user_id,u.email,coalesce(g.enabled,false) as enabled,g.expires_at,g.updated_at
  from auth.users u left join public.developer_grants g on g.user_id=u.id
  where u.raw_app_meta_data->>'aup_role'='developer' and u.deleted_at is null
  order by u.email limit 200
 ) r;
 return result;
end;
$$;
revoke all on function aup_private.manage_developer_access(uuid,boolean) from public,anon;
grant execute on function aup_private.manage_developer_access(uuid,boolean) to authenticated,service_role;
create function public.manage_developer_access(p_user_id uuid default null,p_enabled boolean default null) returns jsonb
language sql volatile security invoker set search_path = '' as $$
 select aup_private.manage_developer_access(p_user_id,p_enabled);
$$;
revoke all on function public.manage_developer_access(uuid,boolean) from public,anon;
grant execute on function public.manage_developer_access(uuid,boolean) to authenticated,service_role;
notify pgrst,'reload schema';
