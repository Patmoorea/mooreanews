-- Coordonnées GPS pour afficher une info sur la carte interactive
-- Exécuter dans Supabase → SQL Editor

alter table public.info_pratiques
  add column if not exists lat double precision,
  add column if not exists lon double precision,
  add column if not exists map_icon_url text;

-- RAI TAHITI (base Pihaena PK 14,5) — ajustez si besoin
update public.info_pratiques
set lat = -17.5185, lon = -149.772
where lower(title) like '%rai tahiti%'
  and (lat is null or lon is null);
