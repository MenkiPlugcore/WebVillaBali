-- Optional public pin selected by the property owner in the existing editor.
-- Existing publication rules and staff edit permissions continue to apply.
alter table public.properties
  add column maps_url text not null default ''
  constraint properties_maps_url_check check (
    maps_url = '' or (
      char_length(maps_url) <= 2048
      and maps_url !~ '[[:space:][:cntrl:]]'
      and position(chr(92) in maps_url) = 0
      and maps_url ~ '^https://((www\.)?google\.(com|co\.id)/maps(/|[?#]|$)|maps\.google\.(com|co\.id)(/|[?#]|$)|maps\.app\.goo\.gl/[A-Za-z0-9_-]+/?([?#].*)?$|goo\.gl/maps/[A-Za-z0-9_-]+/?([?#].*)?$)'
    )
  );

comment on column public.properties.maps_url is 'Optional owner-selected Google Maps share link shown on published property detail pages.';
notify pgrst, 'reload schema';
