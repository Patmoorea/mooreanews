-- MooreaNews — roadmap features (FAQ, plages, favoris, push topics)
-- Exécuter dans Supabase → SQL Editor après prod-setup-all.sql

-- Préférences push (alertes + digests matin/soir/week-end)
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS topics text[] NOT NULL DEFAULT '{alerts,morning,evening,weekend}';

-- FAQ « Qui sait quoi » curatée
CREATE TABLE IF NOT EXISTS public.faq_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  question      text NOT NULL,
  answer        text NOT NULL,
  category      text NOT NULL DEFAULT 'general',
  source_label  text,
  source_url    text,
  district      text,
  published     boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS faq_entries_category_idx ON public.faq_entries (category, display_order);
CREATE INDEX IF NOT EXISTS faq_entries_published_idx ON public.faq_entries (published);

ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faq_public_read" ON public.faq_entries;
CREATE POLICY "faq_public_read" ON public.faq_entries FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "faq_admin_all" ON public.faq_entries;
CREATE POLICY "faq_admin_all" ON public.faq_entries FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Favoris lecteur (compte Supabase)
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites_own" ON public.user_favorites;
CREATE POLICY "favorites_own" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
