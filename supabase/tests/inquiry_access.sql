begin;
select not has_function_privilege('anon','public.submit_inquiry(uuid,text,jsonb)','EXECUTE') as anon_denied,
 not has_function_privilege('authenticated','public.submit_inquiry(uuid,text,jsonb)','EXECUTE') as authenticated_denied,
 has_function_privilege('service_role','public.submit_inquiry(uuid,text,jsonb)','EXECUTE') as service_allowed,
 not has_table_privilege('anon','public.inquiries','INSERT') as direct_insert_denied,
 not has_table_privilege('anon','public.inquiries','SELECT') as public_read_denied;
set local role service_role;
do $$
declare result jsonb;data jsonb:='{"inquiry_type":"general","name":"Integration fixture","email":"intake-fixture@example.invalid","message":"Rollback verification fixture","language":"id"}';i integer;ticket text;
begin
 result:=public.submit_inquiry('74f847f1-f32d-450c-a64a-7af7d7368201',repeat('a',64),data);
 ticket:=result->>'ticket_no';if ticket !~ '^AUP-[0-9]+$' then raise exception 'Missing ticket';end if;
 if result->>'status'<>'200' then raise exception 'First submission failed';end if;
 result:=public.submit_inquiry('74f847f1-f32d-450c-a64a-7af7d7368201',repeat('a',64),data);
 if result->>'ticket_no' is distinct from ticket then raise exception 'Retry ticket changed';end if;
 if result->>'status'<>'200' or (select count(*) from public.inquiries where email='intake-fixture@example.invalid')<>1 then raise exception 'Retry not idempotent';end if;
 result:=public.submit_inquiry('74f847f1-f32d-450c-a64a-7af7d7368201',repeat('a',64),data||'{"message":"Changed"}');
 if result->>'status'<>'409' then raise exception 'Reuse conflict not rejected';end if;
 begin
 update public.inquiries set ticket_no='AUP-999999' where ticket_no=ticket;
 raise exception 'Ticket alteration accepted';
 exception when check_violation then null;end;
 for i in 2..4 loop
  result:=public.submit_inquiry(('74f847f1-f32d-450c-a64a-7af7d736820'||i)::uuid,repeat('a',64),data);
  if result->>'status'<>(case when i=4 then '429' else '200' end) then raise exception 'Rate limit failed';end if;
 end loop;
end $$;
rollback;
