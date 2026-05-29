/**
 * Filtres d'actualité pour l'import Facebook (Graph API + OG).
 */

import { parseDateFromMessage } from "@/lib/facebook-post-parse";

const DEFAULT_MAX_AGE_DAYS = 60;

export function facebookImportMaxAgeDays(): number {
  const raw = process.env.FACEBOOK_IMPORT_MAX_AGE_DAYS?.trim();
  const n = raw ? Number(raw) : DEFAULT_MAX_AGE_DAYS;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_AGE_DAYS;
}

function maxAgeMs(): number {
  return facebookImportMaxAgeDays() * 24 * 60 * 60 * 1000;
}

/** Date ISO (jour) à partir de created_time Graph API. */
export function publishedAtFromFacebookPost(createdTime?: string): string | null {
  const t = createdTime?.trim();
  if (!t) return null;
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

/** Post Graph API : refus si created_time absent ou trop ancien. */
export function isRecentFacebookPost(createdTime?: string): boolean {
  const iso = publishedAtFromFacebookPost(createdTime);
  if (!iso) return false;
  return Date.now() - Date.parse(iso) <= maxAgeMs();
}

function extractYears(text: string): number[] {
  return [...text.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1]));
}

/** Texte (titre, extrait) mentionnant une année clairement passée (ex. XTERRA 2022). */
export function contentReferencesStaleYear(text: string): boolean {
  const threshold = new Date().getFullYear() - 1;
  return extractYears(text).some((y) => y <= threshold);
}

/** Années très anciennes (2023 et avant en 2026) — pour audit hors Facebook. */
export function contentReferencesVeryStaleYear(text: string): boolean {
  const threshold = new Date().getFullYear() - 3;
  return extractYears(text).some((y) => y <= threshold);
}

/** Années obsolètes typiques d’imports Facebook (2024 et avant en 2026). */
export function contentReferencesFacebookStaleYear(text: string): boolean {
  const threshold = new Date().getFullYear() - 2;
  return extractYears(text).some((y) => y <= threshold);
}

/**
 * Import autorisé si le post est récent (created_time) et le contenu
 * ne pointe pas vers un événement / annonce d'une année déjà dépassée.
 */
export function shouldImportFacebookPost(
  message: string,
  createdTime?: string,
): { ok: true; publishedAt: string } | { ok: false; reason: string } {
  const corpus = message.trim();
  if (contentReferencesStaleYear(corpus)) {
    return { ok: false, reason: "stale_year_in_text" };
  }

  const publishedAt = publishedAtFromFacebookPost(createdTime);
  if (!publishedAt) {
    return { ok: false, reason: "missing_created_time" };
  }
  if (!isRecentFacebookPost(createdTime)) {
    return { ok: false, reason: "post_too_old" };
  }

  const eventDate = parseDateFromMessage(corpus, publishedAt.slice(0, 10));
  if (eventDate) {
    const eventMs = Date.parse(`${eventDate}T12:00:00Z`);
    if (!Number.isNaN(eventMs) && Date.now() - eventMs > maxAgeMs()) {
      return { ok: false, reason: "event_date_too_old" };
    }
  }

  return { ok: true, publishedAt };
}
