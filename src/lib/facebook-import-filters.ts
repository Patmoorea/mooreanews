/**
 * Filtres d'actualité pour l'import Facebook (Graph API + OG).
 */

import type { FacebookPostForImport } from "@/lib/facebook-article-import";
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
  post?: Pick<FacebookPostForImport, "full_picture">,
): { ok: true; publishedAt: string } | { ok: false; reason: string } {
  if (post && !facebookPostHasPublishableContent({ message, ...post })) {
    return { ok: false, reason: "no_publishable_content" };
  }

  const corpus = message.trim();
  if (isFacebookJunkText(corpus)) {
    return { ok: false, reason: "facebook_content_unavailable" };
  }
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

const FB_SOURCE_FOOTER_RE =
  /\n\n---\n\nSource : \[Publication Facebook[^\]]*\]\([^)]*\)\s*$/;

/** Titres / textes Facebook quand le post est privé, supprimé ou inaccessible. */
const FB_UNAVAILABLE_RE =
  /contenu n['’]est pas disponible|content isn['’]t available|not available right now|page not found|ce lien est peut[- ]être cassé/i;

const FB_GENERIC_TITLE_RE =
  /^[^—]+ — publication$/i;

/** Texte ou titre inutilisable (erreur Facebook, coquille générique). */
export function isFacebookJunkText(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (/facebook\.com\/(share|share\/p)/i.test(t)) return true;
  if (FB_UNAVAILABLE_RE.test(t)) return true;
  if (FB_GENERIC_TITLE_RE.test(t) && t.length < 80) return true;
  return false;
}

/** Corps utile (hors pied de page « Source Facebook »). */
export function facebookArticleBodyWithoutFooter(body: string): string {
  return body.replace(FB_SOURCE_FOOTER_RE, "").trim();
}

/** Extrait auto-généré sans contenu réel. */
function isGenericFacebookExcerpt(excerpt: string | null | undefined): boolean {
  const e = (excerpt ?? "").trim();
  if (!e) return true;
  return /^Publication repérée sur la page Facebook/i.test(e);
}

/** Fiche créée sans texte ni affiche exploitable (coquille vide). */
export function isEmptyFacebookArticleShell(row: {
  title: string;
  excerpt: string | null;
  body: string;
  cover_url?: string | null;
}): boolean {
  if (isFacebookJunkText(row.title)) return true;

  const hasCover = Boolean(row.cover_url?.trim());
  if (hasCover) return false;

  const core = facebookArticleBodyWithoutFooter(row.body);
  const stripped = core
    .replace(/^Publication Facebook — [^.]+\.?\s*$/i, "")
    .trim();

  const genericTitle = /— publication$/i.test(row.title.trim());
  if (genericTitle) {
    return stripped.length < 20;
  }

  const excerptLen = (row.excerpt ?? "").trim().length;
  if (isGenericFacebookExcerpt(row.excerpt)) {
    return stripped.length < 20;
  }

  return stripped.length < 15 && excerptLen < 15;
}

/** Post Graph API / OG : au moins un texte lisible ou une image. */
export function facebookPostHasPublishableContent(
  post: Pick<FacebookPostForImport, "message" | "full_picture">,
): boolean {
  const msg = post.message?.trim() ?? "";
  if (isFacebookJunkText(msg)) return false;
  const pic = post.full_picture?.trim() ?? "";
  if (msg.length >= 40) return true;
  if (msg.length >= 20 && pic.length > 0) return true;
  return false;
}

export function isFacebookImportArticle(row: {
  tags?: string[] | null;
  slug?: string | null;
}): boolean {
  return (
    (row.tags ?? []).includes("facebook-import") ||
    (row.slug ?? "").includes("-fb-")
  );
}

export function isStaleFacebookImportRow(row: {
  title: string;
  excerpt: string | null;
  body: string;
  slug: string;
  published_at?: string | null;
  cover_url?: string | null;
}): boolean {
  if (isEmptyFacebookArticleShell(row)) return true;

  const corpus = `${row.title} ${row.excerpt ?? ""} ${row.body}`;
  if (contentReferencesStaleYear(corpus)) return true;
  if (
    /\bpublication du 20\d{2}-\d{2}-\d{2}\b/i.test(row.title) &&
    contentReferencesStaleYear(row.title)
  ) {
    return true;
  }

  if (row.published_at) {
    const ms = Date.parse(row.published_at);
    if (!Number.isNaN(ms) && Date.now() - ms > maxAgeMs()) {
      return true;
    }
  }

  return /-fb-\d+-\d+$/.test(row.slug) && contentReferencesStaleYear(corpus);
}
