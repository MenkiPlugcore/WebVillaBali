-- Current staff role and a live session, rather than stale JWT metadata.
-- This narrowly scoped definer lives outside the exposed public schema. It can
-- only return the caller's role; it cannot read arbitrary users or change data.
create or replace function aup_private.current_staff_role() returns text
language sql stable security definer set search_path = '' as $$
 select u.raw_app_meta_data->>'aup_role'
 from auth.users u
 join auth.sessions s on s.user_id=u.id
 where u.id=(select auth.uid())
   and s.id::text=(select auth.jwt()->>'session_id')
   and (s.not_after is null or s.not_after>pg_catalog.now())
   and u.deleted_at is null
   and (u.banned_until is null or u.banned_until<=pg_catalog.now())
   and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false'
   and u.raw_app_meta_data->>'aup_role' in ('owner','admin','editor')
 limit 1;
$$;
revoke all on function aup_private.current_staff_role() from public;
grant execute on function aup_private.current_staff_role() to anon,authenticated,service_role;

create or replace function aup_private.is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
 select coalesce((select aup_private.current_staff_role()) in ('owner','admin'),false);
$$;
create or replace function aup_private.can_edit_content() returns boolean
language sql stable security invoker set search_path = '' as $$
 select coalesce((select aup_private.current_staff_role()) in ('owner','admin','editor'),false);
$$;

-- A caller-scoped boolean for the panel and authenticated media endpoint.
create or replace function public.staff_access() returns boolean
language sql stable security invoker set search_path = '' as $$
 select aup_private.can_edit_content();
$$;
revoke all on function public.staff_access() from public,anon;
grant execute on function public.staff_access() to authenticated,service_role;
notify pgrst,'reload schema';
