begin;
-- Fixtures and staff claims exist only inside this rollback transaction.
insert into public.guest_moments(id,storage_path,caption_id,consent_confirmed,publication_status) values
('74f847f1-f32d-450c-a64a-7af7d7368301','guest_moments/74f847f1-f32d-450c-a64a-7af7d7368301/74f847f1-f32d-450c-a64a-7af7d7368301.jpg','Rollback live',true,'published'),
('74f847f1-f32d-450c-a64a-7af7d7368302','guest_moments/74f847f1-f32d-450c-a64a-7af7d7368302/74f847f1-f32d-450c-a64a-7af7d7368302.jpg','Rollback draft',false,'draft'),
('74f847f1-f32d-450c-a64a-7af7d7368303','guest_moments/74f847f1-f32d-450c-a64a-7af7d7368303/74f847f1-f32d-450c-a64a-7af7d7368303.jpg','Rollback archive',true,'archived');
insert into public.properties(id,slug,title_id,title_en,property_type,purpose,publication_status) values ('74f847f1-f32d-450c-a64a-7af7d7368311','rollback-flow-property','Uji','Test','villa','rent','published');
insert into public.motorbikes(id,slug,name,publication_status,availability) values ('74f847f1-f32d-450c-a64a-7af7d7368312','rollback-flow-motor','Test','published','available');
insert into public.services(id,slug,title_id,title_en,publication_status) values ('74f847f1-f32d-450c-a64a-7af7d7368313','rollback-flow-service','Uji','Test','published');
set local role anon;
do $$begin
 if (select count(*) from public.guest_moments where caption_id like 'Rollback %')<>1 then raise exception 'Draft/archived guest photo exposed';end if;
 begin perform 1 from public.inquiries;raise exception 'Anonymous ticket exposure';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role service_role;
do $$declare typ text;idx integer:=0;ref uuid;data jsonb;result jsonb;retry jsonb;ticket text;begin
 foreach typ in array array['property','motorbike','service'] loop
  idx:=idx+1;ref:=('74f847f1-f32d-450c-a64a-7af7d736831'||idx)::uuid;
  data:=jsonb_build_object('inquiry_type',typ,typ||'_id',ref,'name','Rollback flow','email','rollback-flow@example.invalid','message','Rollback only','language','id');
  result:=public.submit_inquiry(('74f847f1-f32d-450c-a64a-7af7d736832'||idx)::uuid,repeat('c',64),data);ticket:=result->>'ticket_no';
  if result->>'status'<>'200' or ticket !~ '^AUP-[0-9]+$' then raise exception 'Ticket creation failed for %',typ;end if;
  if not exists(select 1 from public.inquiries where ticket_no=ticket and inquiry_type=typ and status='new' and coalesce(property_id,motorbike_id,service_id)=ref) then raise exception 'Wrong ticket reference for %',typ;end if;
  retry:=public.submit_inquiry(('74f847f1-f32d-450c-a64a-7af7d736832'||idx)::uuid,repeat('c',64),data);
  if retry->>'ticket_no' is distinct from ticket then raise exception 'Duplicate retry for %',typ;end if;
 end loop;
 if (select count(*) from public.inquiries where email='rollback-flow@example.invalid')<>3 then raise exception 'Duplicate tickets';end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"aup_role":"editor"}}',true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.inquiries where email='rollback-flow@example.invalid') then raise exception 'Editor saw private tickets';end if;
 update public.inquiries set status='closed' where email='rollback-flow@example.invalid';if found then raise exception 'Editor modified tickets';end if;
 begin update public.guest_moments set publication_status='published' where id='74f847f1-f32d-450c-a64a-7af7d7368302';raise exception 'Consent bypass';exception when check_violation then null;end;
 update public.guest_moments set consent_confirmed=true,publication_status='published' where id='74f847f1-f32d-450c-a64a-7af7d7368302';if not found then raise exception 'Guest publishing failed';end if;
 update public.guest_moments set publication_status='archived' where id='74f847f1-f32d-450c-a64a-7af7d7368302';
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"aup_role":"admin"}}',true);
set local role authenticated;
do $$declare state text;n integer;begin
 if (select count(*) from public.inquiries where email='rollback-flow@example.invalid')<>3 then raise exception 'Admin could not read tickets';end if;
 foreach state in array array['contacted','in_progress','closed'] loop
  update public.inquiries set status=state,internal_notes='Rollback staff note' where email='rollback-flow@example.invalid';get diagnostics n=row_count;
  if n<>3 then raise exception 'Admin status update failed';end if;
 end loop;
 if (select count(*) from public.inquiries where email='rollback-flow@example.invalid' and status='closed' and internal_notes='Rollback staff note')<>3 then raise exception 'Processing not persisted';end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","user_metadata":{"aup_role":"owner"},"app_metadata":{}}',true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.inquiries where email='rollback-flow@example.invalid') then raise exception 'Customer saw tickets or internal notes';end if;
end $$;
reset role;
rollback;
select 'passed: guest visibility/consent, three ticket references, idempotency, admin status/notes and editor/customer denial; fixtures rolled back' as verification;
