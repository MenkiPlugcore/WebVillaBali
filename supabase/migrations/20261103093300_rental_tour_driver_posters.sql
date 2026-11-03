-- Two fixed poster slots reuse owner-managed private rental artwork storage.
-- Keep existing staff/MFA policies and the transactional cleanup outbox.
alter table public.site_media drop constraint site_media_key_check;
alter table public.site_media add constraint site_media_key_check
 check (key in ('rental_hero','tour_poster','driver_poster'));
alter table public.site_media drop constraint site_media_storage_path_check;
alter table public.site_media add constraint site_media_storage_path_check
 check (storage_path ~ ('^site_media/'||key||'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'));

create or replace function aup_private.valid_cleanup_path(p_path text) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(p_path ~ '^((properties|motorbikes|guest_moments)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|site_media/(rental_hero|tour_poster|driver_poster))/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$',false);
$$;
revoke all on function aup_private.valid_cleanup_path(text) from public,anon,authenticated;
notify pgrst,'reload schema';
