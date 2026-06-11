-- Emplacements publicitaires MooreaNews (admin)

create table if not exists public.ad_campaigns (
  id              text primary key,
  name            text not null,
  image           text not null,
  image_width     int not null default 1536,
  image_height    int not null default 1024,
  format_images   jsonb not null default '{}'::jsonb,
  ad_package      text not null default 'cible'
    check (ad_package in ('essentiel', 'cible', 'premium')),
  href            text not null,
  alt             text not null default '',
  sponsor         text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.ad_campaigns
  add column if not exists format_images jsonb not null default '{}'::jsonb;

alter table public.ad_campaigns
  add column if not exists ad_package text not null default 'cible';

alter table public.ad_campaigns drop constraint if exists ad_campaigns_ad_package_check;
alter table public.ad_campaigns
  add constraint ad_campaigns_ad_package_check
  check (ad_package in ('essentiel', 'cible', 'premium'));

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
insert into public.ad_campaigns (id, name, image, image_width, image_height, format_images, ad_package, href, alt, sponsor, active)
values
  (
    'moorea-maitai',
    'Moorea Maitai — Snack Bar',
    '/images/ads/moorea-maitai/moorea-maitai-ad-billboard-970x250.png',
    970,
    250,
    '{
      "leaderboard": "/images/ads/moorea-maitai/moorea-maitai-ad-leaderboard-728x90.png",
      "billboard": "/images/ads/moorea-maitai/moorea-maitai-ad-billboard-970x250.png",
      "rectangle": "/images/ads/moorea-maitai/moorea-maitai-ad-rectangle-300x250.png",
      "sidebar": "/images/ads/moorea-maitai/moorea-maitai-ad-rectangle-300x250.png",
      "card": "/images/ads/moorea-maitai/moorea-maitai-ad-card-300x200.png",
      "ribbon": "/images/ads/moorea-maitai/moorea-maitai-ad-ribbon-468x60.png"
    }'::jsonb,
    'premium',
    'https://www.facebook.com/profile.php?id=61555377901751',
    'Moorea Maitai Snack Bar — Sunset Beach Maharepa, cuisine locale, tapas, grillades, fruits de mer. 7/7 11h-21h',
    'Moorea Maitai',
    true
  ),
  (
    'rai-tahiti',
    'RAI TAHITI — Transport sanitaire VSL',
    '/images/ads/rai-tahiti/rai-tahiti-ad-leaderboard-728x90.png',
    728,
    90,
    '{
      "leaderboard": "/images/ads/rai-tahiti/rai-tahiti-ad-leaderboard-728x90.png",
      "billboard": "/images/ads/rai-tahiti/rai-tahiti-ad-billboard-970x250.png",
      "rectangle": "/images/ads/rai-tahiti/rai-tahiti-ad-rectangle-300x250.png",
      "sidebar": "/images/ads/rai-tahiti/rai-tahiti-ad-rectangle-300x250.png",
      "card": "/images/ads/rai-tahiti/rai-tahiti-ad-card-300x200.png",
      "ribbon": "/images/ads/rai-tahiti/rai-tahiti-ad-ribbon-468x60.png"
    }'::jsonb,
    'premium',
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
  format_images = excluded.format_images,
  ad_package = excluded.ad_package,
  href = excluded.href,
  alt = excluded.alt,
  sponsor = excluded.sponsor,
  active = excluded.active;

insert into public.ad_slots (id, label, format, campaign_id, enabled, sort_order) values
  ('home-leaderboard', 'Accueil — bandeau principal (sous le hero)', 'leaderboard', null, true, 10),
  ('home-articles', 'Accueil — entre actualités et événements', 'billboard', null, true, 20),
  ('home-events', 'Accueil — après l''agenda', 'rectangle', null, true, 30),
  ('home-map', 'Accueil — avant la carte interactive', 'billboard', null, true, 40),
  ('actualites-top', 'Actualités — haut de liste', 'leaderboard', null, true, 50),
  ('actualites-inline', 'Actualités — encart dans la grille', 'card', null, true, 60),
  ('article-bottom', 'Article — sous le contenu', 'billboard', null, true, 70),
  ('restaurants-top', 'Restaurants — haut de page', 'leaderboard', null, true, 80),
  ('restaurants-inline', 'Restaurants — encart dans la liste', 'rectangle', null, true, 90),
  ('evenements-top', 'Événements — haut de page', 'billboard', null, true, 100),
  ('visiteurs-mid', 'Visiteurs — bandeau partenaire', 'leaderboard', null, true, 110),
  ('sante-garde-mid', 'Santé / garde — bandeau partenaire', 'leaderboard', null, true, 115),
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
