-- Only the server role can lease/acknowledge jobs. Browser input never names an
-- object to delete. Existing references are checked before a job is leased.
create function public.media_cleanup(p_action text,p_path text default null,p_jobs jsonb default null,p_token text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;job record;lease uuid;item jsonb;valid_token boolean;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server access required' using errcode='42501';end if;
 if p_action='verify' then
  select length(coalesce(p_token,''))=64 and decrypted_secret=p_token into valid_token
   from vault.decrypted_secrets where name='aup_media_cleanup_token';
  return to_jsonb(coalesce(valid_token,false));
 elsif p_action='enqueue' then
  if not aup_private.valid_cleanup_path(p_path) then raise exception 'Invalid path' using errcode='22023';end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_path,19));
  insert into aup_private.media_cleanup_jobs(storage_path) values(p_path) on conflict(storage_path) do nothing;
 elsif p_action='claim' then
  result:='[]'::jsonb;
  for job in
   select j.id,j.storage_path from aup_private.media_cleanup_jobs j
   where j.completed_at is null and j.available_at<=now() and (j.lease_until is null or j.lease_until<now())
    and not exists(select 1 from public.property_images where storage_path=j.storage_path)
    and not exists(select 1 from public.motorbike_images where storage_path=j.storage_path)
    and not exists(select 1 from public.guest_moments where storage_path=j.storage_path)
    and not exists(select 1 from public.site_media where storage_path=j.storage_path)
   order by j.available_at,j.id limit 50 for update skip locked
  loop
   if not aup_private.valid_cleanup_path(job.storage_path) then continue;end if;
   lease:=gen_random_uuid();
   update aup_private.media_cleanup_jobs set lease_token=lease,lease_until=now()+interval '2 minutes',attempts=attempts+1 where id=job.id;
   result:=result||jsonb_build_array(jsonb_build_object('id',job.id,'storage_path',job.storage_path,'lease_token',lease));
  end loop;
  return result;
 elsif p_action in ('complete','retry') then
  if jsonb_typeof(p_jobs)<>'array' or jsonb_array_length(p_jobs)>50 then raise exception 'Invalid jobs';end if;
  for item in select * from jsonb_array_elements(p_jobs) loop
   update aup_private.media_cleanup_jobs set
    completed_at=case when p_action='complete' then now() else null end,
    available_at=case when p_action='retry' then now()+make_interval(secs=>least(3600,30*power(2,least(attempts,7)))::double precision) else available_at end,
    lease_token=null,lease_until=null
   where id=(item->>'id')::uuid and lease_token=(item->>'lease_token')::uuid and completed_at is null;
  end loop;
 else raise exception 'Invalid cleanup action' using errcode='22023';end if;
 return jsonb_build_object('pending',(select count(*) from aup_private.media_cleanup_jobs where completed_at is null));
end;
$$;
revoke all on function public.media_cleanup(text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.media_cleanup(text,text,jsonb,text) to service_role;
