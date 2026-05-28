-- Affiche jointe aux soumissions /soumettre
-- Exécuter dans Supabase → SQL Editor

alter table public.submissions
  add column if not exists cover_url text;
