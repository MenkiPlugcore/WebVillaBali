-- Keep existing guest documentation in the property gallery.
-- Staff can explicitly choose the rental gallery using the existing editor.
alter table public.guest_moments
  add column category text not null default 'property'
  constraint guest_moments_category_check check (category in ('property','motorbike'));

comment on column public.guest_moments.category is 'Gallery destination: property guests or motorbike rental customers. Existing publication and consent rules still apply.';
notify pgrst, 'reload schema';
