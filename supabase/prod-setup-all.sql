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
