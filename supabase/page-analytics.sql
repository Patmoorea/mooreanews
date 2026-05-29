-- Statistiques de visites (anonymes) — Admin MooreaNews
-- Exécuter dans Supabase → SQL Editor

create table if not exists public.page_views (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  referrer    text,
  visitor_id  text,
  viewed_at   timestamptz not null default now()
);

create index if not exists page_views_viewed_at_idx
  on public.page_views (viewed_at desc);

create index if not exists page_views_path_idx
  on public.page_views (path);

alter table public.page_views enable row level security;

drop policy if exists "page_views_public_insert" on public.page_views;
create policy "page_views_public_insert" on public.page_views
  for insert with check (true);

drop policy if exists "page_views_admin_read" on public.page_views;
create policy "page_views_admin_read" on public.page_views
  for select using (public.is_admin());
