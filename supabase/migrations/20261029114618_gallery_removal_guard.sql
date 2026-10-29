-- Lock the parent and image before validating a destructive gallery action.
create function public.remove_gallery_photo(p_table text,p_parent uuid,p_image uuid,p_expected_path text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare images text;parent_column text;locked_id uuid;current_path text;
begin
 if not aup_private.can_edit_content() then raise exception 'Staff access required' using errcode='42501';end if;
 if p_table='properties' then images:='property_images';parent_column:='property_id';
 elsif p_table='motorbikes' then images:='motorbike_images';parent_column:='motorbike_id';
 else raise exception 'Invalid gallery' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_table||p_parent::text,3));
 execute pg_catalog.format('select id from public.%I where id=$1 for update',p_table) into locked_id using p_parent;
 if locked_id is null then raise exception 'Parent not found' using errcode='P0002';end if;
 execute pg_catalog.format('select storage_path from public.%I where id=$1 and %I=$2 for update',images,parent_column) into current_path using p_image,p_parent;
 if current_path is null then raise exception 'Photo not found' using errcode='P0002';end if;
 if p_expected_path is null or current_path is distinct from p_expected_path then raise exception 'Photo changed' using errcode='22023';end if;
 return public.manage_gallery(p_table,p_parent,'remove',p_image,null);
end;
$$;
revoke all on function public.remove_gallery_photo(text,uuid,uuid,text) from public,anon;
grant execute on function public.remove_gallery_photo(text,uuid,uuid,text) to authenticated;
notify pgrst,'reload schema';
