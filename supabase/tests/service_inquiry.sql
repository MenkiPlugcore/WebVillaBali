begin;
insert into public.services(id,slug,title_id,title_en,publication_status) values
('74f847f1-f32d-450c-a64a-7af7d7368251','service-test-live','Layanan uji','Test service','published'),
('74f847f1-f32d-450c-a64a-7af7d7368252','service-test-draft','Draft','Draft','draft');
set local role anon;
do $$begin
 if (select count(*) from public.services where id in ('74f847f1-f32d-450c-a64a-7af7d7368251','74f847f1-f32d-450c-a64a-7af7d7368252'))<>1 then raise exception 'Draft service exposed';end if;
 if has_function_privilege('anon','public.submit_inquiry(uuid,text,jsonb)','EXECUTE') then raise exception 'Public RPC access';end if;
end $$;
reset role;
set local role service_role;
do $$declare data jsonb:='{"inquiry_type":"service","service_id":"74f847f1-f32d-450c-a64a-7af7d7368252","name":"Rollback fixture","email":"service-fixture@example.invalid","message":"Rollback only","language":"id"}';r jsonb;ticket text;begin
 r:=public.submit_inquiry('74f847f1-f32d-450c-a64a-7af7d7368261',repeat('b',64),data);
 if r->>'status'<>'404' then raise exception 'Draft service accepted';end if;
 data:=data||'{"service_id":"74f847f1-f32d-450c-a64a-7af7d7368251"}';
 r:=public.submit_inquiry('74f847f1-f32d-450c-a64a-7af7d7368262',repeat('b',64),data);ticket:=r->>'ticket_no';
 if r->>'status'<>'200' or ticket is null then raise exception 'Published service rejected';end if;
 if not exists(select 1 from public.inquiries where ticket_no=ticket and service_id='74f847f1-f32d-450c-a64a-7af7d7368251' and inquiry_type='service') then raise exception 'Service ticket lost reference';end if;
 r:=public.submit_inquiry('74f847f1-f32d-450c-a64a-7af7d7368262',repeat('b',64),data);
 if r->>'ticket_no'<>ticket then raise exception 'Retry changed ticket';end if;
 update public.services set publication_status='archived' where id='74f847f1-f32d-450c-a64a-7af7d7368251';
 r:=public.submit_inquiry('74f847f1-f32d-450c-a64a-7af7d7368263',repeat('b',64),data);
 if r->>'status'<>'404' then raise exception 'Archived service accepted';end if;
end $$;
rollback;
