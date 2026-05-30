-- Fermetures définitives signalées — à exécuter une fois dans l’éditeur SQL Supabase.
UPDATE restaurants
SET
  published = false,
  hours = 'Fermé définitivement'
WHERE name ILIKE '%mahogany%';
