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

function normalizeTitleForDedupe(title: string): string {
  return normalizeTitleKey(
    title
      .replace(/\p{Extended_Pictographic}/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160),
  );
}

function facebookStoryIdFromPermalink(permalink: string): string | null {
  const id =
    permalink.match(/\/posts\/(\d+)/)?.[1] ??
    permalink.match(/permalink\/(\d+)/)?.[1] ??
    permalink.match(/fbid=(\d+)/)?.[1];
  return id && id.length >= 8 ? id : null;
}

/** Clé stable pour regrouper les doublons (même publication Facebook, IDs/slugs différents). */
export function articleDisplayDedupeKey(
  article: Pick<Article, "slug" | "title" | "publishedAt" | "image" | "body">,
): string {
  const day = article.publishedAt.slice(0, 10);
  const titleKey = normalizeTitleForDedupe(article.title);

  // Imports Facebook : priorité au titre + jour (les affiches fbcdn diffèrent souvent).
  if (article.slug.includes("-fb-") && titleKey.length >= 10) {
    return `fb-title:${titleKey}:${day}`;
  }

  const permalink = article.body
    ? facebookPermalinkFromArticleBody(article.body)
    : null;
  if (permalink) {
    const storyId = facebookStoryIdFromPermalink(permalink);
    if (storyId) return `fb-story:${storyId}`;
    try {
      const u = new URL(permalink);
      return `fb:${u.pathname}${u.search}`;
    } catch {
      return `fb:${permalink}`;
    }
  }

  if (titleKey.length >= 12) {
    return `title:${titleKey}:${day}`;
  }

  const img = article.image?.split("?")[0]?.trim() ?? "";
  if (img.length > 20 && !img.includes("fbcdn.net")) {
    return `img:${img}`;
  }

  return `slug:${article.slug}`;
}

function articleDisplayScore(
  article: Pick<Article, "title" | "publishedAt" | "image" | "body" | "excerpt">,
): number {
  let score = 0;
  const cover = article.image?.trim() ?? "";
  if (cover && !cover.includes("fbcdn.net")) score += 25;
  else if (cover) score += 10;
  const body = article.body ?? "";
  const excerpt = article.excerpt ?? "";
  score += Math.min(body.length, 800) / 20;
  score += Math.min(excerpt.length, 280) / 30;
  if (facebookPermalinkFromArticleBody(body)) score += 3;
  score += Date.parse(article.publishedAt) / 1e15;
  return score;
}

/** Garde la fiche la plus complète par clé de déduplication. */
export function dedupeArticlesForDisplay(articles: Article[]): Article[] {
  const byKey = new Map<string, Article>();
  for (const article of articles) {
    const key = articleDisplayDedupeKey(article);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, article);
      continue;
    }
    if (articleDisplayScore(article) >= articleDisplayScore(prev)) {
      byKey.set(key, article);
    }
  }
  return [...byKey.values()].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
