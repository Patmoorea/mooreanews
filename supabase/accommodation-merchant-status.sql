-- Disponibilité hébergement déclarée par l'hébergeur (comme statut ouvert resto)

ALTER TABLE public.accommodations
  ADD COLUMN IF NOT EXISTS merchant_availability_status text
    CHECK (
      merchant_availability_status IS NULL OR
      merchant_availability_status IN ('available', 'limited', 'contact', 'full')
    ),
  ADD COLUMN IF NOT EXISTS merchant_availability_updated_at timestamptz;

COMMENT ON COLUMN public.accommodations.merchant_availability_status IS
  'Déclaration hébergeur — prioritaire si < 48 h';
COMMENT ON COLUMN public.accommodations.merchant_availability_updated_at IS
  'Horodatage déclaration disponibilité (Pacific/Tahiti)';
