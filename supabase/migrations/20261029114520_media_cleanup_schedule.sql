-- A purpose-specific scheduler token is generated inside Vault, never returned
-- to the browser or committed. It cannot access Auth, data, or arbitrary files.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if not exists(select 1 from vault.secrets where name='aup_media_cleanup_token') then
  perform vault.create_secret(replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),'aup_media_cleanup_token','Only authorizes the queued media cleanup worker');
 end if;
end $$;
create function aup_private.dispatch_media_cleanup() returns void
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from aup_private.media_cleanup_jobs where completed_at is null and available_at<=now() and (lease_until is null or lease_until<now())) then
  perform net.http_post(
   url:='https://tvcmwkzwemrwwewphfgh.supabase.co/functions/v1/media-cleanup',
   headers:=jsonb_build_object('Content-Type','application/json','x-cleanup-token',(select decrypted_secret from vault.decrypted_secrets where name='aup_media_cleanup_token')),
   body:='{}'::jsonb,timeout_milliseconds:=30000);
 end if;
end;
$$;
revoke all on function aup_private.dispatch_media_cleanup() from public,anon,authenticated;
select cron.schedule('aup-media-cleanup','* * * * *','select aup_private.dispatch_media_cleanup()');
revoke all on net.http_request_queue from public,anon,authenticated;
notify pgrst,'reload schema';
