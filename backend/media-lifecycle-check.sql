-- Run as the migration role. Synthetic metadata only; every change rolls back.
begin;
do $$
declare parent_id uuid:=gen_random_uuid();first_id uuid:=gen_random_uuid();second_id uuid:=gen_random_uuid();
 moment_id uuid:=gen_random_uuid();p1 text;p2 text;p3 text;g1 text;g2 text;retired_rejected boolean:=false;
begin
 p1:='properties/'||parent_id||'/'||gen_random_uuid()||'.png';
 p2:='properties/'||parent_id||'/'||gen_random_uuid()||'.jpg';
 p3:='properties/'||parent_id||'/'||gen_random_uuid()||'.webp';
 insert into public.properties(id,slug,title_id,title_en,property_type,purpose)
 values(parent_id,'media-check-'||parent_id,'Media check','Media check','villa','rent');
 insert into public.property_images(id,property_id,storage_path,is_cover,sort_order)
 values(first_id,parent_id,p1,true,0),(second_id,parent_id,p2,false,1);
 update public.property_images set storage_path=p3 where id=first_id;
 if not exists(select 1 from aup_private.media_cleanup_jobs where storage_path=p1 and completed_at is null)
 or exists(select 1 from aup_private.media_cleanup_jobs where storage_path=p3) then raise exception 'Replacement queue failed';end if;
 if not exists(select 1 from public.property_images where id=first_id and storage_path=p3 and is_cover and sort_order=0) then raise exception 'Replacement metadata changed';end if;
 delete from public.properties where id=parent_id;
 if exists(select 1 from public.property_images where property_id=parent_id)
 or (select count(*) from aup_private.media_cleanup_jobs where storage_path in (p1,p2,p3))<>3 then raise exception 'Cascade cleanup queue failed';end if;
 insert into public.properties(id,slug,title_id,title_en,property_type,purpose)
 values(parent_id,'media-check-'||parent_id,'Media check','Media check','villa','rent');
 begin
  insert into public.property_images(property_id,storage_path) values(parent_id,p1);
 exception when invalid_parameter_value then retired_rejected:=true;
 end;
 if not retired_rejected then raise exception 'A retired path was reused';end if;
 g1:='guest_moments/'||moment_id||'/'||gen_random_uuid()||'.png';
 g2:='guest_moments/'||moment_id||'/'||gen_random_uuid()||'.png';
 insert into public.guest_moments(id,storage_path) values(moment_id,g1);
 update public.guest_moments set storage_path=g2 where id=moment_id;
 delete from public.guest_moments where id=moment_id;
 if (select count(*) from aup_private.media_cleanup_jobs where storage_path in (g1,g2))<>2 then raise exception 'Guest cleanup queue failed';end if;
end $$;
select 'replacement, cascade, retired-path guard and guest cleanup passed' as verification;
rollback;
