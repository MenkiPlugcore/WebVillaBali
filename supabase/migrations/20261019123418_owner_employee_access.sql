-- Owner-only management of existing employee accounts. Account creation remains
-- in Supabase Auth; this API never issues credentials, invitations or owner roles.
CREATE OR REPLACE FUNCTION aup_private.current_staff_role()
 RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
 select u.raw_app_meta_data->>'aup_role'
 from auth.users u join auth.sessions s on s.user_id=u.id
 where u.id=(select auth.uid())
 and s.id::text=(select auth.jwt()->>'session_id')
 and (select auth.jwt()->>'aal')='aal2' and s.aal::text='aal2'
 and exists(select 1 from auth.mfa_factors f where f.user_id=u.id and f.status::text='verified' and f.factor_type::text='totp')
 and (s.not_after is null or s.not_after>pg_catalog.now())
 and s.created_at > pg_catalog.now() - interval '7 days'
 and (u.raw_app_meta_data->>'aup_staff_since' is null or s.created_at >= (u.raw_app_meta_data->>'aup_staff_since')::timestamptz)
 and u.deleted_at is null
 and (u.banned_until is null or u.banned_until<=pg_catalog.now())
 and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false'
 and u.raw_app_meta_data->>'aup_role' in ('owner','admin','editor','developer')
 and (u.raw_app_meta_data->>'aup_role'<>'developer' or exists(
   select 1 from public.developer_grants g where g.user_id=u.id and g.enabled and (g.expires_at is null or g.expires_at>pg_catalog.now())))
 limit 1;
$function$;

create function aup_private.manage_staff_access(p_email text default null,p_user_id uuid default null,p_role text default null,p_enabled boolean default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare target auth.users%rowtype; result jsonb; prior_role text; requested_role text;
begin
 if coalesce(aup_private.current_staff_role(),'')<>'owner' then
  raise exception 'Hanya owner yang dapat mengatur akun karyawan.' using errcode='42501';
 end if;
 if p_email is not null or p_user_id is not null or p_role is not null or p_enabled is not null then
  if (p_email is null)=(p_user_id is null) or p_enabled is null or p_role is null or p_role not in ('editor','admin') then
   raise exception 'Pilih satu akun, peran Editor/Admin, dan status akses.' using errcode='22023';
  end if;
  if p_email is not null and (length(btrim(p_email))>254 or btrim(p_email)!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
   raise exception 'Email karyawan tidak valid.' using errcode='22023';
  end if;
  select * into target from auth.users u
   where ((p_user_id is not null and u.id=p_user_id) or (p_email is not null and lower(u.email)=lower(btrim(p_email))))
   and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now())
   for update;
  if not found then raise exception 'Akun belum terdaftar atau tidak aktif. Daftarkan email di Supabase Auth terlebih dahulu.' using errcode='P0002';end if;
  prior_role:=coalesce(target.raw_app_meta_data->>'aup_role','');
  if target.id=auth.uid() or prior_role not in ('','editor','admin','staff_disabled') then
   raise exception 'Akun owner, developer, dan peran khusus tidak dapat diubah dari menu karyawan.' using errcode='42501';
  end if;
  if not p_enabled and prior_role not in ('editor','admin','staff_disabled') then
   raise exception 'Akun ini belum memiliki akses karyawan.' using errcode='22023';
  end if;
  requested_role:=case when p_enabled then p_role else 'staff_disabled' end;
  if prior_role<>requested_role or coalesce(target.raw_app_meta_data->>'aup_staff_role',prior_role)<>p_role then
   update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||jsonb_build_object(
    'aup_role',requested_role,'aup_staff_role',p_role,'aup_staff_since',clock_timestamp())
    where id=target.id;
   insert into public.staff_activity(actor_id,actor_role,session_id,table_name,record_key,action)
    values(auth.uid(),'owner',auth.jwt()->>'session_id','staff_access',target.id::text,'UPDATE');
  end if;
 end if;
 select coalesce(jsonb_agg(to_jsonb(r) order by r.email),'[]'::jsonb) into result from (
  select u.id as user_id,u.email,
   case when u.raw_app_meta_data->>'aup_role'='staff_disabled' then u.raw_app_meta_data->>'aup_staff_role' else u.raw_app_meta_data->>'aup_role' end as role,
   u.raw_app_meta_data->>'aup_role' in ('editor','admin') as enabled,
   u.email_confirmed_at is not null as email_confirmed,
   exists(select 1 from auth.mfa_factors f where f.user_id=u.id and f.factor_type::text='totp' and f.status::text='verified') as mfa_enabled,
   u.last_sign_in_at
  from auth.users u where u.deleted_at is null and u.raw_app_meta_data->>'aup_role' in ('editor','admin','staff_disabled')
  order by u.email limit 200
 ) r;
 return result;
end;
$$;
revoke all on function aup_private.manage_staff_access(text,uuid,text,boolean) from public,anon;
grant execute on function aup_private.manage_staff_access(text,uuid,text,boolean) to authenticated,service_role;
create function public.manage_staff_access(p_email text default null,p_user_id uuid default null,p_role text default null,p_enabled boolean default null) returns jsonb
language sql volatile security invoker set search_path = '' as $$
 select aup_private.manage_staff_access(p_email,p_user_id,p_role,p_enabled);
$$;
revoke all on function public.manage_staff_access(text,uuid,text,boolean) from public,anon;
grant execute on function public.manage_staff_access(text,uuid,text,boolean) to authenticated,service_role;
notify pgrst,'reload schema';
