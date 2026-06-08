/**
 * Pipeline récap semaine — affiche + article (cron lundi).
 */

import {
  buildWeeklyRecapSnapshot,
  weeklyRecapHasContent,
  type WeeklyRecapSnapshot,
} from "@/lib/weekly-recap-data";
import { renderAndUploadWeeklyRecapPoster } from "@/lib/weekly-recap-poster-sync";
import { upsertWeeklyRecapArticle } from "@/lib/weekly-recap-article";

export async function syncWeeklyRecapFromMooreaNews(): Promise<{
  ok: boolean;
  found: boolean;
  weekLabel: string | null;
  articleSlug: string | null;
  eventsCount: number;
  articlesCount: number;
  posterGenerated: boolean;
  articleCreated: boolean;
  articleUpdated: boolean;
  articleError?: string;
  posterUrl?: string | null;
}> {
  let snap: WeeklyRecapSnapshot;
  try {
    snap = await buildWeeklyRecapSnapshot();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      found: false,
      weekLabel: null,
      articleSlug: null,
      eventsCount: 0,
      articlesCount: 0,
      posterGenerated: false,
      articleCreated: false,
      articleUpdated: false,
      articleError: msg.slice(0, 200),
    };
  }

  const poster = await renderAndUploadWeeklyRecapPoster(snap);
  if (poster) snap.posterImageUrl = poster;

  snap.syncedAt = new Date().toISOString();
  const article = await upsertWeeklyRecapArticle(snap);

  return {
    ok: true,
    found: weeklyRecapHasContent(snap) || Boolean(poster),
    weekLabel: snap.label,
    articleSlug: article.slug,
    eventsCount: snap.events.length,
    articlesCount: snap.articles.length,
    posterGenerated: Boolean(snap.posterImageUrl),
    articleCreated: article.created,
    articleUpdated: article.updated,
    articleError: article.error,
    posterUrl: snap.posterImageUrl ?? null,
  };
}
