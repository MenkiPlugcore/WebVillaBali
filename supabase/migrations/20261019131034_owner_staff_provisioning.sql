create table aup_private.staff_account_requests(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 email text not null,
 role text not null check(role in ('editor','admin')),
 action text not null check(action in ('create','activate')),
 user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 completed_at timestamptz
);
create index staff_account_requests_owner_time on aup_private.staff_account_requests(owner_id,created_at desc);
alter table aup_private.staff_account_requests enable row level security;
revoke all on aup_private.staff_account_requests from public,anon,authenticated,service_role;

create function aup_private.begin_staff_account(p_action text,p_email text default null,p_role text default null,p_user_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare target auth.users%rowtype; request aup_private.staff_account_requests%rowtype; address text; staff text; link_type text;
begin
 if coalesce(aup_private.current_staff_role(),'')<>'owner' then raise exception 'Hanya owner dengan MFA aktif yang dapat menambahkan akun.' using errcode='42501';end if;
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
$$;
revoke all on function aup_private.begin_staff_account(text,text,text,uuid) from public,anon;
grant execute on function aup_private.begin_staff_account(text,text,text,uuid) to authenticated,service_role;
create function public.begin_staff_account(p_action text,p_email text default null,p_role text default null,p_user_id uuid default null) returns jsonb
language sql volatile security invoker set search_path='' as $$ select aup_private.begin_staff_account(p_action,p_email,p_role,p_user_id); $$;
revoke all on function public.begin_staff_account(text,text,text,uuid) from public,anon;
grant execute on function public.begin_staff_account(text,text,text,uuid) to authenticated,service_role;

create function aup_private.finish_staff_account(p_request_id uuid,p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare request aup_private.staff_account_requests%rowtype; target auth.users%rowtype; link_type text;
begin
 if coalesce(aup_private.current_staff_role(),'')<>'owner' then raise exception 'Akses owner sudah tidak aktif.' using errcode='42501';end if;
 select * into request from aup_private.staff_account_requests where id=p_request_id and owner_id=auth.uid() and created_at>now()-interval '5 minutes' and completed_at is null for update;
 if not found then raise exception 'Permintaan akun sudah berakhir atau sudah diproses.' using errcode='22023';end if;
 select * into target from auth.users where id=p_user_id and deleted_at is null and (banned_until is null or banned_until<=now()) for update;
 if not found or target.id=auth.uid() or lower(target.email)<>lower(request.email) or coalesce(target.raw_app_meta_data->>'aup_role','')<>request.role
 or exists(select 1 from auth.mfa_factors where user_id=target.id and status::text='verified') then raise exception 'Akun berubah atau tidak dapat diaktifkan.' using errcode='42501';end if;
 if request.action='create' and (coalesce(target.raw_app_meta_data->>'aup_staff_request','')<>request.id::text or target.created_at<request.created_at or target.email_confirmed_at is not null) then raise exception 'Akun tidak cocok dengan permintaan pembuatan.' using errcode='42501';end if;
 if request.action='activate' and request.user_id is distinct from target.id then raise exception 'Akun tidak cocok dengan permintaan aktivasi.' using errcode='42501';end if;
 link_type:=case when target.email_confirmed_at is null then 'invite' else 'recovery' end;
 update aup_private.staff_account_requests set user_id=target.id,completed_at=clock_timestamp() where id=request.id;
 insert into public.staff_activity(actor_id,actor_role,session_id,table_name,record_key,action) values(auth.uid(),'owner',auth.jwt()->>'session_id',case when request.action='create' then 'staff_accounts' else 'staff_activation' end,target.id::text,case when request.action='create' then 'INSERT' else 'UPDATE' end);
 return jsonb_build_object('user_id',target.id,'email',target.email,'role',request.role,'link_type',link_type);
end;
$$;
revoke all on function aup_private.finish_staff_account(uuid,uuid) from public,anon;
grant execute on function aup_private.finish_staff_account(uuid,uuid) to authenticated,service_role;
create function public.finish_staff_account(p_request_id uuid,p_user_id uuid) returns jsonb
language sql volatile security invoker set search_path='' as $$ select aup_private.finish_staff_account(p_request_id,p_user_id); $$;
revoke all on function public.finish_staff_account(uuid,uuid) from public,anon;
grant execute on function public.finish_staff_account(uuid,uuid) to authenticated,service_role;
notify pgrst,'reload schema';
