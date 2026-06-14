/**
 * Filtres d'actualité pour l'import Facebook (Graph API + OG).
 */

import type { FacebookPostForImport } from "@/lib/facebook-article-import";
import { isFacebookPageBoilerplate } from "@/lib/ferry-notice-detect";
import { parseDateFromMessage } from "@/lib/facebook-post-parse";

export type FacebookImportFilterOptions = {
  /** Page MooreaNews : tout ce qui est dans le fil (texte, affiche seule, etc.). */
  importAllFeedPosts?: boolean;
};

const DEFAULT_MAX_AGE_DAYS = 60;

export function facebookImportMaxAgeDays(): number {
  const raw = process.env.FACEBOOK_IMPORT_MAX_AGE_DAYS?.trim();
  const n = raw ? Number(raw) : DEFAULT_MAX_AGE_DAYS;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_AGE_DAYS;
}

/** Posts récents traités par cron (évite timeout Vercel ~60 s). */
export function facebookCronRecentPostLimit(): number {
  const raw = process.env.FACEBOOK_CRON_RECENT_LIMIT?.trim();
  const n = raw ? Number(raw) : 15;
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 80) : 15;
}

export function facebookCronMaxRepairsPerRun(): number {
  const raw = process.env.FACEBOOK_CRON_MAX_REPAIRS?.trim();
  const n = raw ? Number(raw) : 40;
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 80) : 40;
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
  post?: Pick<
    FacebookPostForImport,
    "id" | "message" | "full_picture" | "permalink_url" | "created_time"
  >,
  options?: FacebookImportFilterOptions,
): { ok: true; publishedAt: string } | { ok: false; reason: string } {
  if (options?.importAllFeedPosts) {
    const publishedAt = publishedAtFromFacebookPost(createdTime);
    if (!publishedAt) {
      return { ok: false, reason: "missing_created_time" };
    }
    if (!isRecentFacebookPost(createdTime)) {
      return { ok: false, reason: "post_too_old" };
    }
    if (!post?.id?.trim()) {
      return { ok: false, reason: "missing_post_id" };
    }
    return { ok: true, publishedAt };
  }

  if (
    post &&
    !facebookPostHasPublishableContent({ message, ...post }, options)
  ) {
    return { ok: false, reason: "no_publishable_content" };
  }

  const corpus = message.trim();
  const hasImage = Boolean(post?.full_picture?.trim());
  if (
    corpus &&
    isFacebookJunkText(corpus) &&
    !(options?.importAllFeedPosts && hasImage)
  ) {
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

/** Faux texte renvoyé par l’API Graph à la place du vrai post (le lien public reste valide). */
const FB_API_BOILERPLATE_RE =
  /ce probl[eè]me vient g[eé]n[eé]ralement du fait que le propri[eé]taire|partag[eé] qu['’]avec un petit groupe|modified who could see|changed who could see|this content isn['’]t available|n['’]est plus disponible|ce lien peut ne plus/i;

const FB_GENERIC_TITLE_RE =
  /^[^—]+ — publication$/i;

/** Titre auto-généré quand Graph/OG n’ont pas encore renvoyé le vrai contenu. */
const FB_AUTO_PLACEHOLDER_TITLE_RE =
  /^[^—]+ — (publication|affiche) · \d{2}\/\d{2}/i;

const FB_AUTO_PLACEHOLDER_EXCERPT_RE =
  /^Publication Facebook [^·]+ · \d{2}\/\d{2}/i;

const FB_AUTO_PLACEHOLDER_BODY_RE =
  /^Publication Facebook — [^.]+\.\s*$/i;

/** Notifications système Facebook — pas des actualités. */
const FB_STATUS_UPDATE_RE =
  /updated their status|changed their profile picture|updated their profile picture|changed the group photo|changed their cover photo|updated their cover photo|added a cover photo|added a profile picture|a (?:changé|modifié) (?:sa|leur|son) (?:photo|couverture)|nouvelle photo de (?:profil|couverture)|est (?:à|en) [^.!?]{0,40}$|is feeling|added a (?:new )?video|a ajouté une vidéo|shared a (?:post|link) to the group/i;

/** Texte ou titre inutilisable (erreur Facebook, coquille générique). */
export function isFacebookJunkText(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (/facebook\.com\/(share|share\/p)/i.test(t)) return true;
  if (FB_UNAVAILABLE_RE.test(t)) return true;
  if (FB_API_BOILERPLATE_RE.test(t)) return true;
  if (FB_STATUS_UPDATE_RE.test(t)) return true;
  if (isFacebookPageBoilerplate(t)) return true;
  if (FB_GENERIC_TITLE_RE.test(t) && t.length < 80) return true;
  if (/^facebook$/i.test(t)) return true;
  if (/^mooreanews$/i.test(t) && t.length < 20) return true;
  return false;
}

/** Corps utile (hors pied de page « Source Facebook »). */
export function facebookArticleBodyWithoutFooter(body: string): string {
  return body.replace(FB_SOURCE_FOOTER_RE, "").trim();
}

/** Coquille auto (titre « publication · 13/06 » + corps générique). */
export function isFacebookAutoGeneratedPlaceholder(row: {
  title: string;
  excerpt?: string | null;
  body: string;
}): boolean {
  const title = row.title.trim();
  if (!FB_AUTO_PLACEHOLDER_TITLE_RE.test(title)) return false;
  const excerpt = row.excerpt?.trim() ?? "";
  if (
    excerpt &&
    FB_AUTO_PLACEHOLDER_EXCERPT_RE.test(excerpt) &&
    excerpt.length < 120
  ) {
    return true;
  }
  const core = facebookArticleBodyWithoutFooter(row.body).trim();
  if (FB_AUTO_PLACEHOLDER_BODY_RE.test(core)) return true;
  return core.length < 48;
}

/** Fiche sans contenu (erreur API Meta uniquement — pas les affiches seules). */
export function isEmptyFacebookArticleShell(row: {
  title: string;
  excerpt: string | null;
  body: string;
  cover_url?: string | null;
}): boolean {
  if (isFacebookAutoGeneratedPlaceholder(row)) return true;
  if (Boolean(row.cover_url?.trim())) return false;
  return isFacebookJunkText(row.title);
}

/** Article visible sur le site avec affiche persistée Supabase. */
export function isFacebookArticleCompleteOnSite(row: {
  title: string;
  excerpt: string | null;
  body: string;
  cover_url?: string | null;
}): boolean {
  if (isFacebookJunkText(row.title)) return false;
  const cover = row.cover_url?.trim() ?? "";
  if (
    !cover ||
    cover.includes("fbcdn.net") ||
    cover.includes("fbsbx.com")
  ) {
    return false;
  }
  return true;
}

/** Post Graph API / OG : texte, image ou (MooreaNews) toute entrée du fil. */
export function facebookPostHasPublishableContent(
  post: Pick<
    FacebookPostForImport,
    "id" | "message" | "full_picture" | "permalink_url" | "created_time"
  >,
  options?: FacebookImportFilterOptions,
): boolean {
  if (options?.importAllFeedPosts) {
    if (!post.id?.trim() || !post.created_time?.trim()) return false;
    return true;
  }

  const pic = post.full_picture?.trim() ?? "";
  const msg = post.message?.trim() ?? "";

  if (pic.length > 0) return true;
  if (!msg) return false;
  if (isFacebookJunkText(msg)) return false;
  if (msg.length >= 40) return true;
  if (msg.length >= 20 && pic.length > 0) return true;
  if (msg.length >= 8 && pic.length > 0) return true;
  return false;
}

/** Article importé avec texte d’erreur API Meta au lieu du vrai contenu. */
export function isFacebookArticleNeedsRepair(row: {
  title: string;
  excerpt: string | null;
  body: string;
  cover_url?: string | null;
  slug?: string | null;
}): boolean {
  if (isFacebookAutoGeneratedPlaceholder(row)) return true;
  if (isEmptyFacebookArticleShell(row)) return true;
  if (isFacebookJunkText(row.title)) return true;
  if (/^facebook$/i.test(row.title.trim())) return true;
  if (isFacebookJunkText(row.excerpt ?? "")) return true;
  const core = facebookArticleBodyWithoutFooter(row.body);
  if (isFacebookJunkText(core.split("\n")[0] ?? "")) return true;
  if (!row.cover_url?.trim() && isFacebookJunkText(core.slice(0, 200))) {
    return true;
  }
  const cover = row.cover_url?.trim() ?? "";
  const slug = row.slug ?? "";
  if (
    slug.startsWith("mooreanews-fb-") &&
    cover &&
    (cover.includes("fbcdn.net") || cover.includes("fbsbx.com"))
  ) {
    return true;
  }
  return false;
}

/** Article MooreaNews sans affiche persistée — rattrapage Graph/OG. */
export function isFacebookCoverMissingRepair(row: {
  title: string;
  excerpt: string | null;
  body: string;
  cover_url?: string | null;
  slug?: string | null;
}): boolean {
  const slug = row.slug ?? "";
  if (!slug.startsWith("mooreanews-fb-")) return false;
  const cover = row.cover_url?.trim() ?? "";
  if (
    cover &&
    !cover.includes("fbcdn.net") &&
    !cover.includes("fbsbx.com")
  ) {
    return false;
  }
  return true;
}

/** Affiche fbcdn mais texte déjà OK — recopie Supabase sans Graph/OG. */
export function isFacebookCoverNeedsPersistOnly(row: {
  title: string;
  excerpt: string | null;
  body: string;
  cover_url?: string | null;
  slug?: string | null;
}): boolean {
  const slug = row.slug ?? "";
  if (!slug.startsWith("mooreanews-fb-")) return false;
  const cover = row.cover_url?.trim() ?? "";
  if (
    !cover ||
    (!cover.includes("fbcdn.net") && !cover.includes("fbsbx.com"))
  ) {
    return false;
  }
  if (isEmptyFacebookArticleShell(row)) return false;
  if (isFacebookJunkText(row.title)) return false;
  if (isFacebookJunkText(row.excerpt ?? "")) return false;
  const core = facebookArticleBodyWithoutFooter(row.body);
  if (isFacebookJunkText(core.split("\n")[0] ?? "")) return false;
  if (isFacebookJunkText(core.slice(0, 200))) return false;
  return true;
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
  if (row.slug.startsWith("mooreanews-fb-")) {
    if (isFacebookJunkText(row.title) && !row.cover_url?.trim()) return true;
  } else if (isEmptyFacebookArticleShell(row)) {
    return true;
  }

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
