-- Require a verified MFA session for all staff access, including direct API calls.
-- This narrowly scoped definer lives outside the exposed public schema. It can
-- only return the caller's role; it cannot read arbitrary users or change data.
create or replace function aup_private.current_staff_role() returns text
language sql stable security definer set search_path = '' as $$
 select u.raw_app_meta_data->>'aup_role'
 from auth.users u
 join auth.sessions s on s.user_id=u.id
 where u.id=(select auth.uid())
   and s.id::text=(select auth.jwt()->>'session_id')
   and (select auth.jwt()->>'aal')='aal2'
   and s.aal::text='aal2'
   and exists(select 1 from auth.mfa_factors f where f.user_id=u.id and f.status::text='verified' and f.factor_type::text='totp')
   and (s.not_after is null or s.not_after>pg_catalog.now())
   and u.deleted_at is null
   and (u.banned_until is null or u.banned_until<=pg_catalog.now())
   and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false'
   and u.raw_app_meta_data->>'aup_role' in ('owner','admin','editor')
 limit 1;
$$;
revoke all on function aup_private.current_staff_role() from public;
grant execute on function aup_private.current_staff_role() to anon,authenticated,service_role;

notify pgrst,'reload schema';
