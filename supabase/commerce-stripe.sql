-- Monétisation : boost annonces + premium commerçants

alter table public.announcements
  add column if not exists boosted_until timestamptz,
  add column if not exists stripe_session_id text;

alter table public.restaurants
  add column if not exists menu_du_jour text,
  add column if not exists merchant_email text,
  add column if not exists premium_until timestamptz;

create index if not exists announcements_boosted_idx
  on public.announcements (boosted_until desc nulls last);

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
create policy "commerce_payments_admin" on public.commerce_payments
  for all using (public.is_admin()) with check (public.is_admin());
