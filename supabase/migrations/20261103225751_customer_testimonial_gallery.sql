alter table public.guest_moments
  drop constraint guest_moments_category_check,
  add constraint guest_moments_category_check
    check (category in ('property', 'motorbike', 'testimonial'));
