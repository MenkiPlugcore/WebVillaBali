create function aup_private.valid_cleanup_path(p_path text) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(p_path ~ '^((properties|motorbikes|guest_moments)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|site_media/rental_hero)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$',false);
$$;
revoke all on function aup_private.valid_cleanup_path(text) from public,anon,authenticated;

create function aup_private.track_media_object() returns trigger
language plpgsql security definer set search_path='' as $$
declare old_path text;new_path text;
begin
 if tg_op<>'DELETE' then
  new_path:=new.storage_path;
  if tg_op='INSERT' or new_path is distinct from old.storage_path then
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new_path,19));
   -- Tombstones prevent a deleted/queued URL being reused while its worker runs.
   if exists(select 1 from aup_private.media_cleanup_jobs where storage_path=new_path) then
    raise exception 'Upload a new image; this old path has been retired' using errcode='22023';
   end if;
  end if;
 end if;
 if tg_op<>'INSERT' then
  old_path:=old.storage_path;
  if (tg_op='DELETE' or old_path is distinct from new_path) and aup_private.valid_cleanup_path(old_path) then
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(old_path,19));
   insert into aup_private.media_cleanup_jobs(storage_path) values(old_path)
   on conflict(storage_path) do update set available_at=now() where media_cleanup_jobs.completed_at is null;
  end if;
 end if;
 if tg_op='DELETE' then return old;end if;return new;
end;
$$;
revoke all on function aup_private.track_media_object() from public,anon,authenticated;
create trigger track_media_object before insert or update of storage_path or delete on public.property_images for each row execute function aup_private.track_media_object();
create trigger track_media_object before insert or update of storage_path or delete on public.motorbike_images for each row execute function aup_private.track_media_object();
create trigger track_media_object before insert or update of storage_path or delete on public.guest_moments for each row execute function aup_private.track_media_object();
create trigger track_media_object before insert or update of storage_path or delete on public.site_media for each row execute function aup_private.track_media_object();
