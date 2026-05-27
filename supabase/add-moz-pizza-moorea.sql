-- Ajoute Mo'z Pizza (Pizza Moorea — facebook.com/PIZZAMOOREA) si absent.
-- À exécuter dans Supabase → SQL Editor (production).

insert into public.restaurants (
  name,
  description,
  cuisine,
  district,
  address,
  phone,
  hours,
  price_range,
  url,
  published,
  featured
)
select
  'Mo''z Pizza',
  'Pizzeria à Papetoai (Pizza Moorea) : pizzas, poissons, grillades, burgers, salades, tapas, gaufres et pâtisseries. Livraison possible.',
  array['Pizza', 'Grillades', 'Burgers', 'Poisson']::text[],
  'Papetoai',
  'Papetoai PK 22, Moorea',
  '89 42 30 00',
  '7j/7 — Lun-Jeu 17h30-21h ; Ven 11h-21h30 ; Sam-Dim 11h-14h & 17h30-21h (livraison 89 53 08 40)',
  '€€',
  'https://www.facebook.com/PIZZAMOOREA/',
  true,
  false
where not exists (
  select 1 from public.restaurants
  where lower(trim(name)) in (lower('Mo''z Pizza'), lower('Moz Pizza'))
     or url ilike '%PIZZAMOOREA%'
);
