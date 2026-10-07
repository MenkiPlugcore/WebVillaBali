begin;
insert into public.properties(slug,title_en,title_id,property_type,purpose,publication_status) values
('rls-test-draft','Test','Test','villa','rent','draft'),
('rls-test-published','Test','Test','villa','rent','published');
insert into public.property_images(property_id,storage_path) select id,'test/'||slug from public.properties where slug like 'rls-test-%';
insert into public.inquiries(inquiry_type,name,email,message) values ('general','Test','test@example.invalid','RLS verification');
set local role anon;
do $$ begin
 if (select count(*) from public.properties where slug like 'rls-test-%') <> 1 then raise exception 'anonymous draft visibility failed'; end if;
 if (select count(*) from public.property_images where storage_path like 'test/rls-test-%') <> 1 then raise exception 'anonymous image visibility failed'; end if;
 begin perform 1 from public.inquiries; raise exception 'anonymous inquiry read unexpectedly allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.properties(slug,title_en,title_id,property_type,purpose) values ('rls-unauthorized','Test','Test','villa','rent'); raise exception 'anonymous write unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","user_metadata":{"aup_role":"owner"},"app_metadata":{}}',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.inquiries) <> 0 then raise exception 'customer inquiry access failed'; end if;
 if (select count(*) from public.properties where slug like 'rls-test-%') <> 1 then raise exception 'user_metadata escalation failed'; end if;
 begin insert into public.properties(slug,title_en,title_id,property_type,purpose) values ('rls-unauthorized','Test','Test','villa','rent'); raise exception 'customer write unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"aup_role":"editor"}}',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.properties where slug like 'rls-test-%') <> 2 then raise exception 'editor read failed'; end if;
 if (select count(*) from public.inquiries) <> 0 then raise exception 'editor inquiry access failed'; end if;
 update public.properties set title_id='Editor update' where slug='rls-test-draft';
 if not found then raise exception 'editor update failed'; end if;
 begin insert into public.site_settings(key,value) values ('brand','{}'); raise exception 'editor settings unexpectedly allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.guest_moments(storage_path,publication_status) values ('test/no-consent','published'); raise exception 'consent check failed'; exception when check_violation then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"aup_role":"owner"}}',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.inquiries) <> 1 then raise exception 'owner inquiry read failed'; end if;
 update public.inquiries set status='contacted' where email='test@example.invalid';
 if not found then raise exception 'owner inquiry update failed'; end if;
 insert into public.site_settings(key,value) values ('brand','{"name":"Test"}');
end $$;
reset role;
rollback;
select 'passed: public visibility, draft images, denied writes, no metadata escalation, editor restrictions, owner access, consent, update triggers; fixtures rolled back' as verification;
