/**
 * URLs publiques des articles + règles SEO (garde, reprises RSS).
 *
 * Les slugs en base ne changent PAS (l'import Facebook s'appuie dessus) :
 * seuls les liens publics des imports `mooreanews-fb-<page>-<post>` deviennent
 * lisibles (`<titre>-<post>`), avec 301 depuis l'ancienne URL.
 */

import type { Article } from "@/lib/content-types";
import { slugify } from "@/lib/utils";

const FB_SLUG_RE = /^mooreanews-fb-\d+-(\d{8,})$/;
const READABLE_TAIL_RE = /-(\d{8,})$/;

/** Identifiant de publication Facebook d'un slug d'import MooreaNews. */
export function facebookPostIdFromDbSlug(slug: string): string | null {
  return slug.match(FB_SLUG_RE)?.[1] ?? null;
}

/** Identifiant en fin d'URL lisible (`titre-1902101807797474`). */
export function facebookPostIdFromPublicSlug(slug: string): string | null {
  if (slug.startsWith("mooreanews-fb-")) return null;
  return slug.match(READABLE_TAIL_RE)?.[1] ?? null;
}

function titleSlug(title: string): string {
  const base = slugify(title.replace(/\p{Extended_Pictographic}/gu, " "));
  if (base.length <= 70) return base;
  const cut = base.slice(0, 70);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 30 ? cut.slice(0, lastDash) : cut).replace(/-+$/, "");
}

/** Slug public (lisible) d'un article. */
export function publicArticleSlug(a: Pick<Article, "slug" | "title">): string {
  const postId = facebookPostIdFromDbSlug(a.slug);
  if (!postId) return a.slug;
  const t = titleSlug(a.title || "");
  return t ? `${t}-${postId}` : `publication-${postId}`;
}

export function articlePath(a: Pick<Article, "slug" | "title">): string {
  return `/actualites/${publicArticleSlug(a)}`;
}

// ---------------------------------------------------------------------------
// Garde week-end : seule la plus récente est listée / indexée.
// ---------------------------------------------------------------------------

const GARDE_RE = /^garde-(moorea|week-?end)/;

/** Article de garde : slug auto (garde-moorea-*) ou import Facebook titré « Garde week-end … ». */
export function isGardeArticle(a: Pick<Article, "slug"> & { title?: string }): boolean {
  if (GARDE_RE.test(a.slug)) return true;
  return typeof a.title === "string" && GARDE_RE.test(titleSlug(a.title));
}

/** Slug de l'article de garde le plus récent (liste triée ou non). */
export function latestGardeSlug(articles: (Pick<Article, "slug" | "publishedAt"> & { title?: string })[]): string | null {
  let best: { slug: string; t: number } | null = null;
  for (const a of articles) {
    if (!isGardeArticle(a)) continue;
    const t = new Date(a.publishedAt).getTime() || 0;
    if (!best || t > best.t) best = { slug: a.slug, t };
  }
  return best?.slug ?? null;
}

/** Retire des listes les anciennes gardes (garde la plus récente uniquement). */
export function withoutStaleGarde<T extends Pick<Article, "slug" | "publishedAt"> & { title?: string }>(
  articles: T[],
): T[] {
  const latest = latestGardeSlug(articles);
  return articles.filter((a) => !isGardeArticle(a) || a.slug === latest);
}

// ---------------------------------------------------------------------------
// Reprises RSS (Tahiti Infos…) : canonical vers la source, hors sitemap.
// ---------------------------------------------------------------------------

export function isRssCopy(a: Pick<Article, "slug">): boolean {
  return a.slug.startsWith("rss-");
}

/** URL de l'article source cité dans le corps d'une reprise RSS. */
export function rssSourceUrl(a: Pick<Article, "slug" | "body">): string | null {
  if (!isRssCopy(a) || !a.body) return null;
  const urls = a.body.match(/https?:\/\/[^\s)\]"'<>\\]+/g) ?? [];
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (/mooreanews\.com$/.test(u.hostname)) continue;
      if (/\.(jpe?g|png|gif|webp)$/i.test(u.pathname)) continue;
      if (u.pathname === "/" || u.pathname.startsWith("/photo/")) continue;
      return u.toString();
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Article à exclure des sitemaps (doublon / périmé / reprise). */
export function excludeFromSitemap(
  a: Pick<Article, "slug"> & { title?: string },
  latestGarde: string | null,
): boolean {
  if (isRssCopy(a)) return true;
  if (isGardeArticle(a) && a.slug !== latestGarde) return true;
  return false;
}
