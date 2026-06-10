/**
 * Déduplication des actualités importées Facebook (même publication, slugs différents).
 */

import { normalizeTitleKey } from "@/lib/cover-image";
import type { Article } from "@/lib/content-types";

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

function tahitiDay(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso.slice(0, 10);
  return new Date(ms).toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
}

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

export function normalizeArticleTitleForDedupe(title: string): string {
  return normalizeTitleKey(
    title.replace(EMOJI_RE, "").replace(/\s+/g, " ").trim().slice(0, 200),
  );
}

function facebookPermalinkDedupeKey(permalink: string): string | null {
  const storyId =
    permalink.match(/\/posts\/(\d+)/)?.[1] ??
    permalink.match(/\/permalink\/(\d+)/)?.[1] ??
    permalink.match(/fbid=(\d+)/)?.[1];
  if (storyId && storyId.length >= 8) return `fb-story:${storyId}`;
  return null;
}

type DedupeFields = Pick<
  Article,
  "slug" | "title" | "publishedAt" | "image" | "body"
>;

/** Clé stable pour regrouper les doublons (affichage + nettoyage admin). */
export function articleDedupeKey(article: DedupeFields): string {
  const permalink = article.body
    ? facebookPermalinkFromArticleBody(article.body)
    : null;
  if (permalink) {
    const pk = facebookPermalinkDedupeKey(permalink);
    if (pk) return pk;
  }

  const titleKey = normalizeArticleTitleForDedupe(article.title);
  const day = tahitiDay(article.publishedAt);
  if (titleKey.length >= 12) {
    return `title:${titleKey}:${day}`;
  }

  const img = article.image?.split("?")[0]?.trim() ?? "";
  if (img.length > 20) {
    return `img:${img}`;
  }

  return `slug:${article.slug}`;
}

/** @deprecated Alias — utiliser articleDedupeKey */
export const articleDisplayDedupeKey = articleDedupeKey;

/** Garde l’article le plus complet par clé de déduplication. */
export function dedupeArticlesForDisplay(articles: Article[]): Article[] {
  const byKey = new Map<string, Article>();
  for (const article of articles) {
    const key = articleDedupeKey(article);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, article);
      continue;
    }
    const score = (a: Article) =>
      (a.image ? 10 : 0) + Math.min(a.body.length, 500) / 50;
    if (score(article) >= score(prev)) {
      byKey.set(key, article);
    }
  }
  return [...byKey.values()].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
