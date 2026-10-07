-- Agung Ubud Property: empty production foundation, no sample listings.
-- Staff roles are trusted Auth app_metadata.aup_role (never user_metadata).
create schema if not exists aup_private;
revoke all on schema aup_private from public;
grant usage on schema aup_private to anon, authenticated, service_role;

create function aup_private.is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null and coalesce(auth.jwt()->'app_metadata'->>'aup_role','') in ('owner','admin');
$$;
create function aup_private.can_edit_content() returns boolean
language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null and coalesce(auth.jwt()->'app_metadata'->>'aup_role','') in ('owner','admin','editor');
$$;
create function aup_private.touch_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = pg_catalog.now(); return new; end;
$$;
revoke all on all functions in schema aup_private from public;
grant execute on function aup_private.is_admin(), aup_private.can_edit_content() to anon, authenticated, service_role;

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 120),
  description_en text not null default '', description_id text not null default '',
  is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_en text not null check (length(title_en) between 1 and 200),
  title_id text not null check (length(title_id) between 1 and 200),
  description_en text not null default '', description_id text not null default '',
  property_type text not null check (property_type in ('villa','house','land','rental','commercial','kost')),
  purpose text not null check (purpose in ('sale','rent')),
  location_id uuid references public.locations(id) on delete restrict,
  address_public text not null default '',
  price numeric(18,2) check (price >= 0), currency text not null default 'IDR' check (currency in ('IDR','USD')),
  price_period text not null default 'total' check (price_period in ('total','night','day','month','year')),
  tenure text check (tenure in ('freehold','leasehold')),
  bedrooms integer check (bedrooms >= 0), bathrooms integer check (bathrooms >= 0),
  land_area_m2 numeric(12,2) check (land_area_m2 >= 0), building_area_m2 numeric(12,2) check (building_area_m2 >= 0),
  facilities text[] not null default '{}',
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  availability text not null default 'available' check (availability in ('available','reserved','sold','rented','unavailable')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null unique check (length(storage_path) between 1 and 1024),
  alt_en text not null default '', alt_id text not null default '',
  sort_order integer not null default 0, is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index property_one_cover_idx on public.property_images(property_id) where is_cover;
create index property_images_parent_idx on public.property_images(property_id,sort_order);
create index properties_location_idx on public.properties(location_id);
create index properties_catalog_idx on public.properties(property_type,purpose,price) where publication_status='published';
create index properties_published_date_idx on public.properties(created_at desc) where publication_status='published';

create table public.motorbikes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 150),
  description_en text not null default '', description_id text not null default '',
  daily_price numeric(18,2) check (daily_price >= 0), monthly_price numeric(18,2) check (monthly_price >= 0),
  currency text not null default 'IDR' check (currency in ('IDR','USD')),
  engine_cc integer check (engine_cc > 0), included_items text[] not null default '{}',
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  availability text not null default 'available' check (availability in ('available','unavailable')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.motorbike_images (
  id uuid primary key default gen_random_uuid(),
  motorbike_id uuid not null references public.motorbikes(id) on delete cascade,
  storage_path text not null unique check (length(storage_path) between 1 and 1024),
  alt_en text not null default '', alt_id text not null default '',
  sort_order integer not null default 0, is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index motorbike_one_cover_idx on public.motorbike_images(motorbike_id) where is_cover;
create index motorbike_images_parent_idx on public.motorbike_images(motorbike_id,sort_order);
create index motorbikes_catalog_idx on public.motorbikes(sort_order) where publication_status='published';

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_en text not null, title_id text not null,
  description_en text not null default '', description_id text not null default '',
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.guest_moments (
  id uuid primary key default gen_random_uuid(), storage_path text not null unique,
  caption_en text not null default '', caption_id text not null default '', location_label text not null default '',
  consent_confirmed boolean not null default false,
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (publication_status <> 'published' or consent_confirmed)
);
create table public.testimonials (
  id uuid primary key default gen_random_uuid(), display_name text not null,
  description_en text not null default '', description_id text not null default '',
  quote_en text not null, quote_id text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  consent_confirmed boolean not null default false,
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (publication_status <> 'published' or consent_confirmed)
);
create table public.site_settings (
  key text primary key check (key in ('brand','contact','homepage','social_links')),
  value jsonb not null default '{}' check (jsonb_typeof(value)='object'),
  updated_at timestamptz not null default now()
);
comment on table public.site_settings is 'Public business configuration only; never store passwords, API keys, personal inquiries or internal notes here.';
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type text not null check (inquiry_type in ('property','motorbike','service','general')),
  property_id uuid references public.properties(id) on delete set null,
  motorbike_id uuid references public.motorbikes(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  name text not null check (length(name) between 1 and 150),
  email text check (length(email) <= 254), phone text check (length(phone) <= 40),
  message text not null check (length(message) between 1 and 5000),
  language text not null default 'en' check (language in ('en','id')),
  status text not null default 'new' check (status in ('new','contacted','in_progress','closed','spam')),
  internal_notes text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (nullif(trim(email),'') is not null or nullif(trim(phone),'') is not null)
);
create index inquiries_status_date_idx on public.inquiries(status,created_at desc);
create index inquiries_property_idx on public.inquiries(property_id);
create index inquiries_motorbike_idx on public.inquiries(motorbike_id);
create index inquiries_service_idx on public.inquiries(service_id);

alter table public.locations enable row level security;
revoke all on public.locations from anon, authenticated;
grant select,insert,update,delete on public.locations to authenticated;
grant all on public.locations to service_role;
create trigger set_updated_at before update on public.locations for each row execute function aup_private.touch_updated_at();
create policy staff_content_insert on public.locations for insert to authenticated with check ((select aup_private.can_edit_content()));
create policy staff_content_update on public.locations for update to authenticated using ((select aup_private.can_edit_content())) with check ((select aup_private.can_edit_content()));
create policy staff_content_delete on public.locations for delete to authenticated using ((select aup_private.can_edit_content()));
grant select on public.locations to anon;
create policy public_read on public.locations for select to anon,authenticated using ((is_active) or (select aup_private.can_edit_content()));

alter table public.properties enable row level security;
revoke all on public.properties from anon, authenticated;
grant select,insert,update,delete on public.properties to authenticated;
grant all on public.properties to service_role;
create trigger set_updated_at before update on public.properties for each row execute function aup_private.touch_updated_at();
create policy staff_content_insert on public.properties for insert to authenticated with check ((select aup_private.can_edit_content()));
create policy staff_content_update on public.properties for update to authenticated using ((select aup_private.can_edit_content())) with check ((select aup_private.can_edit_content()));
create policy staff_content_delete on public.properties for delete to authenticated using ((select aup_private.can_edit_content()));
grant select on public.properties to anon;
create policy public_read on public.properties for select to anon,authenticated using ((publication_status='published') or (select aup_private.can_edit_content()));

alter table public.property_images enable row level security;
revoke all on public.property_images from anon, authenticated;
grant select,insert,update,delete on public.property_images to authenticated;
grant all on public.property_images to service_role;
create policy staff_content_insert on public.property_images for insert to authenticated with check ((select aup_private.can_edit_content()));
create policy staff_content_update on public.property_images for update to authenticated using ((select aup_private.can_edit_content())) with check ((select aup_private.can_edit_content()));
create policy staff_content_delete on public.property_images for delete to authenticated using ((select aup_private.can_edit_content()));
grant select on public.property_images to anon;
create policy public_read on public.property_images for select to anon,authenticated using ((exists (select 1 from public.properties p where p.id=property_id and p.publication_status='published')) or (select aup_private.can_edit_content()));

alter table public.motorbikes enable row level security;
revoke all on public.motorbikes from anon, authenticated;
grant select,insert,update,delete on public.motorbikes to authenticated;
grant all on public.motorbikes to service_role;
create trigger set_updated_at before update on public.motorbikes for each row execute function aup_private.touch_updated_at();
create policy staff_content_insert on public.motorbikes for insert to authenticated with check ((select aup_private.can_edit_content()));
create policy staff_content_update on public.motorbikes for update to authenticated using ((select aup_private.can_edit_content())) with check ((select aup_private.can_edit_content()));
create policy staff_content_delete on public.motorbikes for delete to authenticated using ((select aup_private.can_edit_content()));
grant select on public.motorbikes to anon;
create policy public_read on public.motorbikes for select to anon,authenticated using ((publication_status='published') or (select aup_private.can_edit_content()));

alter table public.motorbike_images enable row level security;
revoke all on public.motorbike_images from anon, authenticated;
grant select,insert,update,delete on public.motorbike_images to authenticated;
grant all on public.motorbike_images to service_role;
create policy staff_content_insert on public.motorbike_images for insert to authenticated with check ((select aup_private.can_edit_content()));
create policy staff_content_update on public.motorbike_images for update to authenticated using ((select aup_private.can_edit_content())) with check ((select aup_private.can_edit_content()));
create policy staff_content_delete on public.motorbike_images for delete to authenticated using ((select aup_private.can_edit_content()));
grant select on public.motorbike_images to anon;
create policy public_read on public.motorbike_images for select to anon,authenticated using ((exists (select 1 from public.motorbikes m where m.id=motorbike_id and m.publication_status='published')) or (select aup_private.can_edit_content()));

alter table public.services enable row level security;
revoke all on public.services from anon, authenticated;
grant select,insert,update,delete on public.services to authenticated;
grant all on public.services to service_role;
create trigger set_updated_at before update on public.services for each row execute function aup_private.touch_updated_at();
create policy staff_content_insert on public.services for insert to authenticated with check ((select aup_private.can_edit_content()));
create policy staff_content_update on public.services for update to authenticated using ((select aup_private.can_edit_content())) with check ((select aup_private.can_edit_content()));
create policy staff_content_delete on public.services for delete to authenticated using ((select aup_private.can_edit_content()));
grant select on public.services to anon;
create policy public_read on public.services for select to anon,authenticated using ((publication_status='published') or (select aup_private.can_edit_content()));

alter table public.guest_moments enable row level security;
revoke all on public.guest_moments from anon, authenticated;
grant select,insert,update,delete on public.guest_moments to authenticated;
grant all on public.guest_moments to service_role;
create trigger set_updated_at before update on public.guest_moments for each row execute function aup_private.touch_updated_at();
create policy staff_content_insert on public.guest_moments for insert to authenticated with check ((select aup_private.can_edit_content()));
create policy staff_content_update on public.guest_moments for update to authenticated using ((select aup_private.can_edit_content())) with check ((select aup_private.can_edit_content()));
create policy staff_content_delete on public.guest_moments for delete to authenticated using ((select aup_private.can_edit_content()));
grant select on public.guest_moments to anon;
create policy public_read on public.guest_moments for select to anon,authenticated using ((publication_status='published') or (select aup_private.can_edit_content()));

alter table public.testimonials enable row level security;
revoke all on public.testimonials from anon, authenticated;
grant select,insert,update,delete on public.testimonials to authenticated;
grant all on public.testimonials to service_role;
create trigger set_updated_at before update on public.testimonials for each row execute function aup_private.touch_updated_at();
create policy staff_content_insert on public.testimonials for insert to authenticated with check ((select aup_private.can_edit_content()));
create policy staff_content_update on public.testimonials for update to authenticated using ((select aup_private.can_edit_content())) with check ((select aup_private.can_edit_content()));
create policy staff_content_delete on public.testimonials for delete to authenticated using ((select aup_private.can_edit_content()));
grant select on public.testimonials to anon;
create policy public_read on public.testimonials for select to anon,authenticated using ((publication_status='published') or (select aup_private.can_edit_content()));

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select,insert,update,delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
create trigger set_updated_at before update on public.site_settings for each row execute function aup_private.touch_updated_at();
grant select on public.site_settings to anon;
create policy public_read on public.site_settings for select to anon,authenticated using (true);
create policy admin_insert on public.site_settings for insert to authenticated with check ((select aup_private.is_admin()));
create policy admin_update on public.site_settings for update to authenticated using ((select aup_private.is_admin())) with check ((select aup_private.is_admin()));
create policy admin_delete on public.site_settings for delete to authenticated using ((select aup_private.is_admin()));

alter table public.inquiries enable row level security;
revoke all on public.inquiries from anon, authenticated;
grant select,insert,update,delete on public.inquiries to authenticated;
grant all on public.inquiries to service_role;
create trigger set_updated_at before update on public.inquiries for each row execute function aup_private.touch_updated_at();
create policy admin_manage on public.inquiries for all to authenticated using ((select aup_private.is_admin())) with check ((select aup_private.is_admin()));

-- Inquiry submission is server-side only, after validation and abuse protection.
-- No anon INSERT policy; an ordinary signed-in customer cannot read inquiries.
notify pgrst, 'reload schema';
