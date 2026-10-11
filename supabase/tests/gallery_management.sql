begin;
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values ('74f847f1-f32d-450c-a64a-7af7d7368401','gallery-test@example.invalid','{}','{"aup_role":"owner"}');
insert into auth.sessions(id,user_id,not_after,aal) values ('74f847f1-f32d-450c-a64a-7af7d7368402','74f847f1-f32d-450c-a64a-7af7d7368401',now()+interval '1 hour','aal2');
insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values (gen_random_uuid(),'74f847f1-f32d-450c-a64a-7af7d7368401','totp','verified',now(),now());

insert into public.properties(id,slug,title_id,title_en,property_type,purpose) values
('74f847f1-f32d-450c-a64a-7af7d7368411','gallery-test-one','Test','Test','villa','rent'),
('74f847f1-f32d-450c-a64a-7af7d7368412','gallery-test-two','Test','Test','villa','rent');
insert into public.property_images(id,property_id,storage_path,is_cover,sort_order)
select ('74f847f1-f32d-450c-a64a-7af7d736842'||n)::uuid,'74f847f1-f32d-450c-a64a-7af7d7368411','properties/74f847f1-f32d-450c-a64a-7af7d7368411/74f847f1-f32d-450c-a64a-7af7d736842'||n||'.jpg',n=1,n-1 from generate_series(1,3)n;
insert into public.motorbikes(id,slug,name) values ('74f847f1-f32d-450c-a64a-7af7d7368411','gallery-test-motor','Test motor');
insert into public.motorbike_images(id,motorbike_id,storage_path,is_cover,sort_order) select ('74f847f1-f32d-450c-a64a-7af7d736843'||n)::uuid,'74f847f1-f32d-450c-a64a-7af7d7368411','motorbikes/74f847f1-f32d-450c-a64a-7af7d7368411/74f847f1-f32d-450c-a64a-7af7d736843'||n||'.jpg',n=1,n-1 from generate_series(1,2)n;
select set_config('request.jwt.claims','{"sub":"74f847f1-f32d-450c-a64a-7af7d7368401","session_id":"74f847f1-f32d-450c-a64a-7af7d7368402","role":"authenticated","aal":"aal2","user_metadata":{"aup_role":"owner"}}',true);
set local role authenticated;
do $$begin
 begin perform public.manage_gallery('properties','74f847f1-f32d-450c-a64a-7af7d7368411','cover','74f847f1-f32d-450c-a64a-7af7d7368422');raise exception 'Customer could edit gallery';exception when insufficient_privilege then null;end;
end $$;
reset role;
update auth.users set raw_app_meta_data='{"aup_role":"editor"}' where id='74f847f1-f32d-450c-a64a-7af7d7368401';
set local role authenticated;
do $$declare parent uuid:='74f847f1-f32d-450c-a64a-7af7d7368411';one uuid:='74f847f1-f32d-450c-a64a-7af7d7368421';two uuid:='74f847f1-f32d-450c-a64a-7af7d7368422';three uuid:='74f847f1-f32d-450c-a64a-7af7d7368423';begin
 perform public.manage_gallery('properties',parent,'cover',two);
 if (select count(*) from public.property_images where property_id=parent and is_cover)<>1 or not (select is_cover from public.property_images where id=two) then raise exception 'Cover swap failed';end if;
 perform public.manage_gallery('properties',parent,'reorder',null,array[three,two,one]);
 if (select sort_order from public.property_images where id=three)<>0 or (select sort_order from public.property_images where id=one)<>2 then raise exception 'Order not persisted';end if;
 begin perform public.manage_gallery('properties',parent,'reorder',null,array[one,one,three]);raise exception 'Duplicate accepted';exception when invalid_parameter_value then null;end;
 begin perform public.manage_gallery('properties',parent,'reorder',null,array[one,two]);raise exception 'Stale partial order accepted';exception when invalid_parameter_value then null;end;
 begin perform public.manage_gallery('properties','74f847f1-f32d-450c-a64a-7af7d7368412','cover',one);raise exception 'Cross-parent accepted';exception when no_data_found then null;end;
 begin perform public.manage_gallery('auth.users',parent,'cover',one);raise exception 'Arbitrary table accepted';exception when invalid_parameter_value then null;end;
 perform public.manage_gallery('motorbikes',parent,'cover','74f847f1-f32d-450c-a64a-7af7d7368432');
 perform public.manage_gallery('motorbikes',parent,'reorder',null,array['74f847f1-f32d-450c-a64a-7af7d7368432'::uuid,'74f847f1-f32d-450c-a64a-7af7d7368431'::uuid]);
 perform public.manage_gallery('motorbikes',parent,'remove','74f847f1-f32d-450c-a64a-7af7d7368432');
 if not (select is_cover from public.motorbike_images where id='74f847f1-f32d-450c-a64a-7af7d7368431') then raise exception 'Motor cover replacement failed';end if;
 perform public.manage_gallery('properties',parent,'remove',two);
 if exists(select 1 from public.property_images where id=two) or not (select is_cover from public.property_images where id=three) then raise exception 'Removal and replacement cover failed';end if;
end $$;
reset role;
update auth.users set raw_app_meta_data='{}' where id='74f847f1-f32d-450c-a64a-7af7d7368401';
set local role authenticated;
do $$begin begin perform public.manage_gallery('properties','74f847f1-f32d-450c-a64a-7af7d7368411','cover','74f847f1-f32d-450c-a64a-7af7d7368421');raise exception 'Revoked role accepted';exception when insufficient_privilege then null;end;end $$;
reset role;
do $$begin if has_function_privilege('anon','public.manage_gallery(text,uuid,text,uuid,uuid[])','execute') then raise exception 'Anonymous RPC permission';end if;end $$;
rollback;
select 'passed: editor gallery cover/reorder/removal, automatic cover replacement, duplicate/stale order rejection, cross-parent/table denial and revoked-role denial; fixtures rolled back' as verification;
