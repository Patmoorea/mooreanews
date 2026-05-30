-- Statut « ouvert maintenant » fiable : Google Places + déclaration commerçant.
-- Exécuter dans l’éditeur SQL Supabase.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS merchant_open_status text
    CHECK (merchant_open_status IS NULL OR merchant_open_status IN ('open', 'closed')),
  ADD COLUMN IF NOT EXISTS merchant_open_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_restaurants_google_place
  ON restaurants (google_place_id)
  WHERE google_place_id IS NOT NULL;

COMMENT ON COLUMN restaurants.google_place_id IS 'Place ID Google Maps (Places API New)';
COMMENT ON COLUMN restaurants.merchant_open_status IS 'Déclaration commerçant : open | closed (prioritaire si < 12 h)';
COMMENT ON COLUMN restaurants.merchant_open_updated_at IS 'Horodatage déclaration commerçant (Pacific/Tahiti)';
