-- MooreaNews — TOUT-EN-UN pour la production
-- Supabase → SQL Editor → coller et exécuter ce fichier une fois.

-- 1) Infos pratiques GPS + logo carte
alter table public.info_pratiques
  add column if not exists lat double precision,
  add column if not exists lon double precision,
  add column if not exists map_icon_url text;

update public.info_pratiques
set lat = -17.5185, lon = -149.772
where lower(title) like '%rai tahiti%'
  and (lat is null or lon is null);

-- 2) Stats visites
create table if not exists public.page_views (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  referrer    text,
  visitor_id  text,
  viewed_at   timestamptz not null default now()
);
create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at desc);
create index if not exists page_views_path_idx on public.page_views (path);
alter table public.page_views
  add column if not exists device_type text check (device_type in ('mobile', 'desktop', 'tablet', 'unknown'));
create index if not exists page_views_device_idx on public.page_views (device_type);
alter table public.page_views enable row level security;
drop policy if exists "page_views_public_insert" on public.page_views;
create policy "page_views_public_insert" on public.page_views for insert with check (true);
drop policy if exists "page_views_admin_read" on public.page_views;
create policy "page_views_admin_read" on public.page_views for select using (public.is_admin());

-- 3) Push + alertes quartier
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  districts   text[] not null default '{}',
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_districts_idx on public.push_subscriptions using gin (districts);

create table if not exists public.alert_email_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  districts   text[] not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists alert_email_subscriptions_districts_idx on public.alert_email_subscriptions using gin (districts);

alter table public.push_subscriptions enable row level security;
alter table public.alert_email_subscriptions enable row level security;
drop policy if exists "push_subscriptions_public_insert" on public.push_subscriptions;
create policy "push_subscriptions_public_insert" on public.push_subscriptions for insert with check (true);
drop policy if exists "alert_email_public_insert" on public.alert_email_subscriptions;
create policy "alert_email_public_insert" on public.alert_email_subscriptions for insert with check (true);
drop policy if exists "push_subscriptions_admin_all" on public.push_subscriptions;
create policy "push_subscriptions_admin_all" on public.push_subscriptions for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "alert_email_admin_all" on public.alert_email_subscriptions;
create policy "alert_email_admin_all" on public.alert_email_subscriptions for all using (public.is_admin()) with check (public.is_admin());

-- 4) Commerce Stripe
alter table public.announcements
  add column if not exists boosted_until timestamptz,
  add column if not exists stripe_session_id text;
alter table public.restaurants
  add column if not exists menu_du_jour text,
  add column if not exists merchant_email text,
  add column if not exists premium_until timestamptz;
create index if not exists announcements_boosted_idx on public.announcements (boosted_until desc nulls last);

create table if not exists public.commerce_payments (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null check (kind in ('announcement_boost', 'restaurant_premium')),
  target_id         uuid not null,
  stripe_session_id text unique,
  amount_cents      integer,
  currency          text default 'eur',
  status            text not null default 'pending',
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);
alter table public.commerce_payments enable row level security;
drop policy if exists "commerce_payments_admin" on public.commerce_payments;
create policy "commerce_payments_admin" on public.commerce_payments for all using (public.is_admin()) with check (public.is_admin());

-- 5) Hébergements (admin + annuaire /hebergements)
create table if not exists public.accommodations (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  description         text not null default '',
  type                text not null default 'pension'
    check (type in ('hotel', 'pension', 'fare', 'villa')),
  district            text not null,
  address             text,
  phone               text,
  email               text,
  url                 text,
  price_hint          text,
  availability_status text not null default 'contact'
    check (availability_status in ('available', 'limited', 'contact', 'full')),
  lat                 double precision,
  lon                 double precision,
  cover_url           text,
  merchant_email      text,
  published           boolean not null default true,
  featured            boolean not null default false,
  premium_until       timestamptz,
  display_order       int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists accommodations_published_idx
  on public.accommodations (published, featured desc, display_order);
create index if not exists accommodations_district_idx
  on public.accommodations (district);
create index if not exists accommodations_premium_idx
  on public.accommodations (premium_until desc nulls last);
alter table public.accommodations enable row level security;
drop policy if exists "accommodations_public_read" on public.accommodations;
create policy "accommodations_public_read" on public.accommodations
  for select using (published = true);
drop policy if exists "accommodations_admin_all" on public.accommodations;
create policy "accommodations_admin_all" on public.accommodations
  for all using (public.is_admin()) with check (public.is_admin());
alter table public.commerce_payments drop constraint if exists commerce_payments_kind_check;
alter table public.commerce_payments add constraint commerce_payments_kind_check
  check (kind in ('announcement_boost', 'restaurant_premium', 'accommodation_premium'));
drop trigger if exists set_updated_at_accommodations on public.accommodations;
create trigger set_updated_at_accommodations
  before update on public.accommodations
  for each row execute function public.set_updated_at();

-- 6) Restaurants — statut ouvert vérifié (Google Places + commerçant)
alter table public.restaurants
  add column if not exists google_place_id text,
  add column if not exists merchant_open_status text
    check (merchant_open_status is null or merchant_open_status in ('open', 'closed')),
  add column if not exists merchant_open_updated_at timestamptz;
create index if not exists idx_restaurants_google_place
  on public.restaurants (google_place_id)
  where google_place_id is not null;

-- 7) Hébergements — dispo déclarée par l'hébergeur
alter table public.accommodations
  add column if not exists merchant_availability_status text
    check (
      merchant_availability_status is null or
      merchant_availability_status in ('available', 'limited', 'contact', 'full')
    ),
  add column if not exists merchant_availability_updated_at timestamptz;

-- 8) Anti-spam formulaires publics (rate limit par IP)
create table if not exists public.form_rate_limits (
  id text primary key,
  hits int not null default 1,
  reset_at timestamptz not null default now()
);
create index if not exists form_rate_limits_reset_at_idx
  on public.form_rate_limits (reset_at);
alter table public.form_rate_limits enable row level security;

-- 9) Inscriptions passagers covoiturage
create table if not exists public.carpool_signups (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  name            text not null,
  phone           text not null,
  message         text,
  created_at      timestamptz not null default now()
);
create index if not exists carpool_signups_announcement_idx
  on public.carpool_signups (announcement_id);
create unique index if not exists carpool_signups_announcement_phone_idx
  on public.carpool_signups (announcement_id, phone);
alter table public.carpool_signups enable row level security;
