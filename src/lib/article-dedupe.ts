/**
 * Déduplication des actualités importées Facebook (même publication, slugs différents).
 */

import { normalizeTitleKey } from "@/lib/cover-image";
import type { Article } from "@/lib/content-types";

/** Extrait l’identifiant story/photo d’un id Graph (PAGEID_STORYID ou photo seule). */
export function facebookStoryIdFromPostId(postId: string): string {
  const trimmed = postId.trim();
  const underscore = trimmed.lastIndexOf("_");
  if (underscore >= 0) return trimmed.slice(underscore + 1);
  return trimmed;
}

/** Permalink Facebook présent dans le corps d’un article importé. */
export function facebookPermalinkFromArticleBody(body: string): string | null {
  const match = body.match(
    /\[Publication Facebook[^\]]*\]\((https:\/\/[^)\s]+)\)/,
  );
  return match?.[1]?.trim() ?? null;
}

/** Clé stable pour regrouper les doublons visibles sur /actualites. */
export function articleDisplayDedupeKey(article: Pick<Article, "slug" | "title" | "publishedAt" | "image" | "body">): string {
  const permalink = article.body
    ? facebookPermalinkFromArticleBody(article.body)
    : null;
  if (permalink) {
    try {
      const u = new URL(permalink);
      const path = u.pathname + u.search;
      if (path.length > 5) return `fb:${path}`;
    } catch {
      return `fb:${permalink}`;
    }
  }

  const img = article.image?.split("?")[0]?.trim() ?? "";
  if (img.length > 20) {
    return `img:${img}`;
  }

  const titleKey = normalizeTitleKey(
    article.title.replace(/[📢🚀]/gu, "").slice(0, 160),
  );
  const day = article.publishedAt.slice(0, 10);
  if (titleKey.length >= 24) {
    return `title:${titleKey}:${day}`;
  }

  return `slug:${article.slug}`;
}

/** Garde l’article le plus récent par clé de déduplication. */
export function dedupeArticlesForDisplay(articles: Article[]): Article[] {
  const byKey = new Map<string, Article>();
  for (const article of articles) {
    const key = articleDisplayDedupeKey(article);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, article);
      continue;
    }
    const tNew = Date.parse(article.publishedAt);
    const tPrev = Date.parse(prev.publishedAt);
    if (tNew >= tPrev) {
      byKey.set(key, article);
    }
  }
  return [...byKey.values()].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
