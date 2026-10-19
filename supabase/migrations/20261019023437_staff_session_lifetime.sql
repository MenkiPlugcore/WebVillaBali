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
 and u.deleted_at is null
 and (u.banned_until is null or u.banned_until<=pg_catalog.now())
 and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false'
 and u.raw_app_meta_data->>'aup_role' in ('owner','admin','editor','developer')
 and (u.raw_app_meta_data->>'aup_role'<>'developer' or exists(
   select 1 from public.developer_grants g where g.user_id=u.id and g.enabled and (g.expires_at is null or g.expires_at>pg_catalog.now())))
 limit 1;
$function$;
