-- Emplacements publicitaires MooreaNews (admin)

create table if not exists public.ad_campaigns (
  id              text primary key,
  name            text not null,
  image           text not null,
  image_width     int not null default 1536,
  image_height    int not null default 1024,
  href            text not null,
  alt             text not null default '',
  sponsor         text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.ad_slots (
  id              text primary key,
  label           text not null,
  format          text not null
    check (format in ('leaderboard', 'billboard', 'rectangle', 'sidebar', 'card', 'ribbon')),
  campaign_id     text references public.ad_campaigns(id) on delete set null,
  enabled         boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists ad_slots_enabled_idx on public.ad_slots (enabled, sort_order);

alter table public.ad_campaigns enable row level security;
alter table public.ad_slots enable row level security;

drop policy if exists "ad_campaigns_public_read" on public.ad_campaigns;
create policy "ad_campaigns_public_read" on public.ad_campaigns
  for select using (active = true);

drop policy if exists "ad_campaigns_admin_all" on public.ad_campaigns;
create policy "ad_campaigns_admin_all" on public.ad_campaigns
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ad_slots_public_read" on public.ad_slots;
create policy "ad_slots_public_read" on public.ad_slots
  for select using (enabled = true);

drop policy if exists "ad_slots_admin_all" on public.ad_slots;
create policy "ad_slots_admin_all" on public.ad_slots
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists set_updated_at_ad_campaigns on public.ad_campaigns;
create trigger set_updated_at_ad_campaigns
  before update on public.ad_campaigns
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_ad_slots on public.ad_slots;
create trigger set_updated_at_ad_slots
  before update on public.ad_slots
  for each row execute function public.set_updated_at();

-- Données initiales (Moorea Maitai + RAI TAHITI + emplacements)
insert into public.ad_campaigns (id, name, image, image_width, image_height, href, alt, sponsor, active)
values
  (
    'moorea-maitai',
    'Moorea Maitai — Snack Bar',
    '/images/ads/moorea-maitai/moorea-maitai-ad-billboard-970x250.png',
    970,
    250,
    'https://www.facebook.com/profile.php?id=61555377901751',
    'Moorea Maitai Snack Bar — Sunset Beach Maharepa, cuisine locale, tapas, grillades, fruits de mer. 7/7 11h-21h',
    'Moorea Maitai',
    true
  ),
  (
    'rai-tahiti',
    'RAI TAHITI — Transport sanitaire VSL',
    '/images/ads/rai-tahiti/rai-tahiti-ad-billboard-970x250.png',
    970,
    250,
    'https://www.raitahiti.com',
    'RAI TAHITI — transport sanitaire VSL conventionné CPS, Moorea & Tahiti, 7j/7.',
    'RAI TAHITI',
    true
  )
on conflict (id) do update set
  name = excluded.name,
  image = excluded.image,
  image_width = excluded.image_width,
  image_height = excluded.image_height,
  href = excluded.href,
  alt = excluded.alt,
  sponsor = excluded.sponsor,
  active = excluded.active;

insert into public.ad_slots (id, label, format, campaign_id, enabled, sort_order) values
  ('home-leaderboard', 'Accueil — bandeau principal (sous le hero)', 'leaderboard', 'moorea-maitai', true, 10),
  ('home-articles', 'Accueil — entre actualités et événements', 'billboard', 'moorea-maitai', true, 20),
  ('home-events', 'Accueil — après l''agenda', 'rectangle', 'moorea-maitai', true, 30),
  ('home-map', 'Accueil — avant la carte interactive', 'billboard', 'moorea-maitai', true, 40),
  ('actualites-top', 'Actualités — haut de liste', 'leaderboard', 'moorea-maitai', true, 50),
  ('actualites-inline', 'Actualités — encart dans la grille', 'card', 'moorea-maitai', true, 60),
  ('article-bottom', 'Article — sous le contenu', 'billboard', 'moorea-maitai', true, 70),
  ('restaurants-top', 'Restaurants — haut de page', 'leaderboard', 'moorea-maitai', true, 80),
  ('restaurants-inline', 'Restaurants — encart dans la liste', 'rectangle', 'moorea-maitai', true, 90),
  ('evenements-top', 'Événements — haut de page', 'billboard', 'moorea-maitai', true, 100),
  ('visiteurs-mid', 'Visiteurs — bandeau RAI TAHITI', 'leaderboard', 'rai-tahiti', true, 110),
  ('sante-garde-mid', 'Santé / garde — bandeau transport VSL', 'leaderboard', 'rai-tahiti', true, 115),
  ('footer-sponsors-01', 'Pied de page — partenaire 1 (ruban 468×60)', 'ribbon', 'moorea-maitai', true, 201),
  ('footer-sponsors-02', 'Pied de page — partenaire 2 (ruban 468×60)', 'ribbon', 'rai-tahiti', true, 202),
  ('footer-sponsors-03', 'Pied de page — partenaire 3 (ruban 468×60)', 'ribbon', null, false, 203),
  ('footer-sponsors-04', 'Pied de page — partenaire 4 (ruban 468×60)', 'ribbon', null, false, 204),
  ('footer-sponsors-05', 'Pied de page — partenaire 5 (ruban 468×60)', 'ribbon', null, false, 205),
  ('footer-sponsors-06', 'Pied de page — partenaire 6 (ruban 468×60)', 'ribbon', null, false, 206),
  ('footer-sponsors-07', 'Pied de page — partenaire 7 (ruban 468×60)', 'ribbon', null, false, 207),
  ('footer-sponsors-08', 'Pied de page — partenaire 8 (ruban 468×60)', 'ribbon', null, false, 208),
  ('footer-sponsors-09', 'Pied de page — partenaire 9 (ruban 468×60)', 'ribbon', null, false, 209),
  ('footer-sponsors-10', 'Pied de page — partenaire 10 (ruban 468×60)', 'ribbon', null, false, 210)
on conflict (id) do update set
  label = excluded.label,
  format = excluded.format,
  campaign_id = excluded.campaign_id,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order;

-- Ancien emplacement unique (remplacé par footer-sponsors-01…10)
delete from public.ad_slots where id = 'footer-sponsors';
