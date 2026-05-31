-- Dépublie les événements Facebook obsolètes (post 2022 recalé sur un vendredi futur).
-- Ex. Sea You Soon « Ce Vendredi soir » → https://www.facebook.com/.../posts/10161882916964937

UPDATE public.events
SET published = false
WHERE published = true
  AND url ILIKE '%facebook.com%posts%'
  AND (
    url ILIKE '%10161882916964937%'
    OR title ILIKE '%Sea You Soon%Le QG%'
    OR (
      title ~* 'ce (vendredi|samedi|dimanche|lundi|mardi|mercredi|jeudi)'
      AND created_at < now() - interval '60 days'
      AND date >= CURRENT_DATE
    )
  );
