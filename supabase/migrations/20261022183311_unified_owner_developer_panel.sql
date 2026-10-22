-- Shared owner/developer management, with separate authenticated identities.
-- Live role, MFA, session expiry and revocable developer grants remain enforced.
-- Existing owner/developer accounts stay protected from employee role changes.
CREATE OR REPLACE FUNCTION aup_private.manage_staff_access(p_email text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_role text DEFAULT NULL::text, p_enabled boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare target auth.users%rowtype; result jsonb; prior_role text; requested_role text;
begin
 if coalesce(aup_private.current_staff_role(),'') not in ('owner','developer') then
  raise exception 'Hanya owner atau developer yang dapat mengatur akun karyawan.' using errcode='42501';
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
    values(auth.uid(),aup_private.current_staff_role(),auth.jwt()->>'session_id','staff_access',target.id::text,'UPDATE');
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
$function$;

CREATE OR REPLACE FUNCTION aup_private.begin_staff_account(p_action text, p_email text DEFAULT NULL::text, p_role text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare target auth.users%rowtype; request aup_private.staff_account_requests%rowtype; address text; staff text; link_type text;
begin
 if coalesce(aup_private.current_staff_role(),'') not in ('owner','developer') then raise exception 'Hanya owner atau developer dengan MFA aktif yang dapat menambahkan akun.' using errcode='42501';end if;
 if p_action='create' then
  if p_user_id is not null or p_email is null or p_role is null or p_role not in ('editor','admin') then raise exception 'Email dan peran Editor/Admin wajib diisi.' using errcode='22023';end if;
  address:=lower(btrim(p_email));staff:=p_role;
  if length(address)>254 or address!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Email karyawan tidak valid.' using errcode='22023';end if;
  if exists(select 1 from auth.users where lower(email)=address) then raise exception 'Email sudah terdaftar. Gunakan akun terdaftar atau buat tautan aktivasi dari kartu karyawan.' using errcode='23505';end if;
  link_type:='invite';
 elsif p_action='activate' then
  if p_user_id is null or p_email is not null or p_role is not null then raise exception 'Pilih akun karyawan.' using errcode='22023';end if;
  select * into target from auth.users where id=p_user_id and deleted_at is null and (banned_until is null or banned_until<=now());
  if not found or target.id=auth.uid() or coalesce(target.raw_app_meta_data->>'aup_role','') not in ('editor','admin') then raise exception 'Akun ini tidak dapat menerima tautan aktivasi karyawan.' using errcode='42501';end if;
  if exists(select 1 from auth.mfa_factors where user_id=target.id and status::text='verified') then raise exception 'Akun sudah memakai MFA. Tautan aktivasi tidak dapat mengubah aksesnya.' using errcode='42501';end if;
  address:=target.email;staff:=target.raw_app_meta_data->>'aup_role';
  link_type:=case when target.email_confirmed_at is null then 'invite' else 'recovery' end;
 else raise exception 'Aksi tidak valid.' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('staff-account:'||auth.uid()::text,0));
 if (select count(*) from aup_private.staff_account_requests where owner_id=auth.uid() and created_at>now()-interval '1 hour')>=10
 or (select count(*) from aup_private.staff_account_requests where owner_id=auth.uid() and created_at>now()-interval '1 minute')>=5 then
  raise exception 'Terlalu banyak permintaan akun. Tunggu beberapa saat lalu coba lagi.' using errcode='54000';
 end if;
 insert into aup_private.staff_account_requests(owner_id,email,role,action,user_id) values(auth.uid(),address,staff,p_action,target.id) returning * into request;
 return jsonb_build_object('request_id',request.id,'email',address,'role',staff,'user_id',target.id,'link_type',link_type,'since',request.created_at);
end;
$function$;

CREATE OR REPLACE FUNCTION aup_private.finish_staff_account(p_request_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare request aup_private.staff_account_requests%rowtype; target auth.users%rowtype; link_type text;
begin
 if coalesce(aup_private.current_staff_role(),'') not in ('owner','developer') then raise exception 'Akses pengelola sudah tidak aktif.' using errcode='42501';end if;
 select * into request from aup_private.staff_account_requests where id=p_request_id and owner_id=auth.uid() and created_at>now()-interval '5 minutes' and completed_at is null for update;
 if not found then raise exception 'Permintaan akun sudah berakhir atau sudah diproses.' using errcode='22023';end if;
 select * into target from auth.users where id=p_user_id and deleted_at is null and (banned_until is null or banned_until<=now()) for update;
 if not found or target.id=auth.uid() or lower(target.email)<>lower(request.email) or coalesce(target.raw_app_meta_data->>'aup_role','')<>request.role
 or exists(select 1 from auth.mfa_factors where user_id=target.id and status::text='verified') then raise exception 'Akun berubah atau tidak dapat diaktifkan.' using errcode='42501';end if;
 if request.action='create' and (coalesce(target.raw_app_meta_data->>'aup_staff_request','')<>request.id::text or target.created_at<request.created_at or target.email_confirmed_at is not null) then raise exception 'Akun tidak cocok dengan permintaan pembuatan.' using errcode='42501';end if;
 if request.action='activate' and request.user_id is distinct from target.id then raise exception 'Akun tidak cocok dengan permintaan aktivasi.' using errcode='42501';end if;
 link_type:=case when target.email_confirmed_at is null then 'invite' else 'recovery' end;
 update aup_private.staff_account_requests set user_id=target.id,completed_at=clock_timestamp() where id=request.id;
 insert into public.staff_activity(actor_id,actor_role,session_id,table_name,record_key,action) values(auth.uid(),aup_private.current_staff_role(),auth.jwt()->>'session_id',case when request.action='create' then 'staff_accounts' else 'staff_activation' end,target.id::text,case when request.action='create' then 'INSERT' else 'UPDATE' end);
 return jsonb_build_object('user_id',target.id,'email',target.email,'role',request.role,'link_type',link_type);
end;
$function$;

CREATE OR REPLACE FUNCTION aup_private.manage_developer_access(p_user_id uuid DEFAULT NULL::uuid, p_enabled boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
 if coalesce(aup_private.current_staff_role(),'') not in ('owner','developer') then raise exception 'Hanya owner atau developer yang dapat mengatur akses developer.' using errcode='42501';end if;
 if p_user_id is null and p_enabled is not null then raise exception 'Pilih akun developer.' using errcode='22023';end if;
 if p_user_id is not null then
  if p_user_id=auth.uid() then raise exception 'Akses akun sendiri harus diatur oleh pengelola lain.' using errcode='42501';end if;
  if p_enabled is null then raise exception 'Status akses wajib diisi.' using errcode='22023';end if;
  perform id from auth.users where id=p_user_id and raw_app_meta_data->>'aup_role'='developer' and deleted_at is null for update;
  if not found then raise exception 'Akun developer tidak ditemukan.' using errcode='22023';end if;
  insert into public.developer_grants(user_id,enabled,expires_at,updated_at,updated_by)
  values(p_user_id,p_enabled,null,now(),auth.uid())
  on conflict(user_id) do update set enabled=excluded.enabled,expires_at=null,updated_at=excluded.updated_at,updated_by=excluded.updated_by;
 end if;
 select coalesce(jsonb_agg(to_jsonb(r) order by r.email),'[]'::jsonb) into result from (
  select u.id as user_id,u.email,coalesce(g.enabled,false) as enabled,g.expires_at,g.updated_at,u.id<>auth.uid() as can_manage
  from auth.users u left join public.developer_grants g on g.user_id=u.id
  where u.raw_app_meta_data->>'aup_role'='developer' and u.deleted_at is null
  order by u.email limit 200
 ) r;
 return result;
end;
$function$;

-- Both management identities can inspect grants and the append-only activity log.
alter policy own_or_owner_read on public.developer_grants
 using ((select aup_private.current_staff_role()) in ('owner','developer'));
alter policy owner_or_own_developer_activity on public.staff_activity
 using ((select aup_private.current_staff_role()) in ('owner','developer'));
notify pgrst,'reload schema';

