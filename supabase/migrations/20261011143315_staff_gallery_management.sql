create or replace function public.manage_gallery(p_table text,p_parent uuid,p_action text,p_image uuid default null,p_order uuid[] default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare images text;parent_column text;current_ids uuid[];target_path text;was_cover boolean;next_id uuid;
begin
 if not aup_private.can_edit_content() then raise exception 'Staff access required' using errcode='42501';end if;
 if p_table='properties' then images:='property_images';parent_column:='property_id';
 elsif p_table='motorbikes' then images:='motorbike_images';parent_column:='motorbike_id';
 else raise exception 'Invalid gallery' using errcode='22023';end if;
 if p_parent is null or p_action not in ('cover','reorder','remove') then raise exception 'Invalid action' using errcode='22023';end if;
 -- Serialize metadata changes for one parent; use caller privileges and RLS.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_table||p_parent::text,3));
 execute pg_catalog.format('select id from public.%I where id=$1 for update',p_table) into next_id using p_parent;
 if next_id is null then raise exception 'Parent not found' using errcode='P0002';end if;
 execute pg_catalog.format('select array_agg(id order by id) from public.%I where %I=$1',images,parent_column) into current_ids using p_parent;
 if p_action='reorder' then
  if p_order is null or cardinality(p_order)>200 or coalesce(current_ids,'{}'::uuid[]) is distinct from (select coalesce(array_agg(x order by x),'{}'::uuid[]) from unnest(p_order) x) then raise exception 'Gallery changed; refresh before reordering' using errcode='22023';end if;
  execute pg_catalog.format('update public.%I i set sort_order=o.n-1 from unnest($2::uuid[]) with ordinality as o(id,n) where i.id=o.id and i.%I=$1',images,parent_column) using p_parent,p_order;
  return jsonb_build_object('success',true);
 end if;
 execute pg_catalog.format('select storage_path,is_cover from public.%I where id=$2 and %I=$1',images,parent_column) into target_path,was_cover using p_parent,p_image;
 if target_path is null then raise exception 'Photo not found' using errcode='P0002';end if;
 if target_path !~ ('^'||p_table||'/'||p_parent::text||'/[0-9a-f-]{36}\.(jpg|png|webp)$') then raise exception 'Invalid photo path' using errcode='22023';end if;
 if p_action='cover' then
  execute pg_catalog.format('update public.%I set is_cover=false where %I=$1 and is_cover',images,parent_column) using p_parent;
  execute pg_catalog.format('update public.%I set is_cover=true where id=$2 and %I=$1',images,parent_column) using p_parent,p_image;
 else
  execute pg_catalog.format('delete from public.%I where id=$2 and %I=$1',images,parent_column) using p_parent,p_image;
  if was_cover then
   execute pg_catalog.format('select id from public.%I where %I=$1 order by sort_order,created_at,id limit 1',images,parent_column) into next_id using p_parent;
   if next_id is not null then execute pg_catalog.format('update public.%I set is_cover=true where id=$1',images) using next_id;end if;
  end if;
 end if;
 return jsonb_build_object('success',true,'storage_path',target_path);
end $$;
revoke all on function public.manage_gallery(text,uuid,text,uuid,uuid[]) from public,anon;
grant execute on function public.manage_gallery(text,uuid,text,uuid,uuid[]) to authenticated;
notify pgrst,'reload schema';
