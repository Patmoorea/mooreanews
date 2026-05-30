-- Stats visites v2 — type d'appareil (exécuter si prod-setup-all.sql déjà fait)
alter table public.page_views
  add column if not exists device_type text check (device_type in ('mobile', 'desktop', 'tablet', 'unknown'));

create index if not exists page_views_device_idx on public.page_views (device_type);
