-- Abonnements push Web (alertes par quartier)
-- Exécuter dans Supabase → SQL Editor

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

create index if not exists push_subscriptions_districts_idx
  on public.push_subscriptions using gin (districts);

-- Alertes email par quartier (en plus de la newsletter générale)
create table if not exists public.alert_email_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  districts   text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists alert_email_subscriptions_districts_idx
  on public.alert_email_subscriptions using gin (districts);

alter table public.push_subscriptions enable row level security;
alter table public.alert_email_subscriptions enable row level security;

drop policy if exists "push_subscriptions_public_insert" on public.push_subscriptions;
create policy "push_subscriptions_public_insert" on public.push_subscriptions
  for insert with check (true);

drop policy if exists "alert_email_public_insert" on public.alert_email_subscriptions;
create policy "alert_email_public_insert" on public.alert_email_subscriptions
  for insert with check (true);

drop policy if exists "push_subscriptions_admin_all" on public.push_subscriptions;
create policy "push_subscriptions_admin_all" on public.push_subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "alert_email_admin_all" on public.alert_email_subscriptions;
create policy "alert_email_admin_all" on public.alert_email_subscriptions
  for all using (public.is_admin()) with check (public.is_admin());
