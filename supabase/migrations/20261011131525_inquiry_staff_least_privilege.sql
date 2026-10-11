-- Staff may handle tickets, but cannot alter customer submissions or delete tickets.
revoke insert,delete,update on public.inquiries from authenticated;
grant update(status,internal_notes) on public.inquiries to authenticated;
notify pgrst,'reload schema';
