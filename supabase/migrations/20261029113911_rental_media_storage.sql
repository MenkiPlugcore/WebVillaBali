-- Owner-managed rental artwork; uploaded originals stay in the private bucket.
create table public.site_media (
 key text primary key check (key='rental_hero'),
 storage_path text not null unique check (storage_path ~ '^site_media/rental_hero/[0-9a-f-]{36}\.(jpg|png|webp)$'),
 updated_at timestamptz not null default now()
);
alter table public.site_media enable row level security;
revoke all on public.site_media from public,anon,authenticated;
grant select on public.site_media to anon,authenticated;
grant insert,update,delete on public.site_media to authenticated;
grant all on public.site_media to service_role;
create policy public_read on public.site_media for select to anon,authenticated using (true);
create policy admin_insert on public.site_media for insert to authenticated with check ((select aup_private.is_admin()));
create policy admin_update on public.site_media for update to authenticated using ((select aup_private.is_admin())) with check ((select aup_private.is_admin()));
create policy admin_delete on public.site_media for delete to authenticated using ((select aup_private.is_admin()));
create trigger set_updated_at before update on public.site_media for each row execute function aup_private.touch_updated_at();
create trigger staff_activity_record after insert or update or delete on public.site_media for each row execute function aup_private.record_staff_activity();

-- Transactional outbox: replacing/deleting metadata, including ON DELETE CASCADE,
-- queues the old exact object path in the same transaction. Never delete storage
-- rows with SQL. The worker uses the supported Storage API after commit.
create table aup_private.media_cleanup_jobs (
 id uuid primary key default gen_random_uuid(),
 storage_path text not null unique,
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 lease_token uuid,
 lease_until timestamptz,
 completed_at timestamptz,
 created_at timestamptz not null default now()
);
alter table aup_private.media_cleanup_jobs enable row level security;
revoke all on aup_private.media_cleanup_jobs from public,anon,authenticated;
grant all on aup_private.media_cleanup_jobs to service_role;
create policy service_only on aup_private.media_cleanup_jobs to service_role using (true) with check (true);
create index media_cleanup_due_idx on aup_private.media_cleanup_jobs(available_at) where completed_at is null;
