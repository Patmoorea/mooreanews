-- MooreaNews — Alertes temps réel (Admin)
-- Exécuter dans Supabase → SQL Editor (après schema.sql si possible)

create table if not exists public.alerts (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('coupure_eau','coupure_edt','route','houle','ferry','meteo','autre')),
  severity    text not null default 'info' check (severity in ('info','warning','alert')),
  title       text not null,
  details     text,
  district    text,
  source_url  text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  active      boolean not null default true,
  urgent      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists alerts_active_idx on public.alerts (active, urgent, created_at desc);

alter table public.alerts enable row level security;

-- Lecture publique (site) : seulement les alertes actives
drop policy if exists "alerts_public_read" on public.alerts;
create policy "alerts_public_read" on public.alerts for select
  using (active = true);

-- Gestion admin/editor uniquement
drop policy if exists "alerts_admin_all" on public.alerts;
create policy "alerts_admin_all" on public.alerts for all
  using (public.is_admin()) with check (public.is_admin());

