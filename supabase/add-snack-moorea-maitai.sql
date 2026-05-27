-- Ajoute Snack Moorea Maïtaï (Maharepa) si absent.
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
  lat,
  lon,
  url,
  published,
  featured
)
select
  'Snack Moorea Maïtaï',
  'Snack convivial à Maharepa, à côté du Manava (site Albert Tours). Cuisine locale, plats du jour et ambiance décontractée.',
  array['Polynésienne', 'Snack']::text[],
  'Maharepa',
  'Maharepa, à côté du Manava — site Albert Tours',
  '87 27 19 19',
  'Mer-Dim 11h-21h (fermé lun-mar)',
  '€',
  -17.480736435267957,
  -149.80411889064598,
  'https://www.facebook.com/profile.php?id=61555377901751',
  true,
  false
where not exists (
  select 1 from public.restaurants
  where lower(trim(name)) = lower('Snack Moorea Maïtaï')
);
