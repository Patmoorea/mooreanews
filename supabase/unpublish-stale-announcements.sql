-- Dépublie les annonces de plus de 90 jours ou déjà expirées (à exécuter une fois si besoin).
UPDATE announcements
SET published = false
WHERE published = true
  AND (
    created_at < now() - interval '90 days'
    OR (expires_at IS NOT NULL AND expires_at <= now())
  );
