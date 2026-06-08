/**
 * Données publiques récap semaine (pastille accueil, ticker).
 */

import { getArticleBySlug } from "@/lib/content";
import { resolveGardePosterPublicUrl } from "@/lib/garde-poster-url";
import { tahitiParts } from "@/lib/tahiti-holidays";
import {
  getTahitiWeekRange,
  isWeeklyRecapWeekActive,
  weeklyRecapArticleSlug,
} from "@/lib/weekly-recap-data";

export type WeeklyRecapHighlight = {
  active: boolean;
  articleSlug: string;
  href: string;
  label: string;
  isFresh: boolean;
  weekLabel: string;
  posterImageUrl: string | null;
};

function buildStickerLabel(weekLabel: string): string {
  const { dow } = tahitiParts(new Date());
  if (dow === 1) return `Semaine à Moorea · agenda & actu · ${weekLabel}`;
  return `Agenda semaine · ${weekLabel}`;
}

function isFreshWeeklyRecap(publishedAt: string, now: Date): boolean {
  const pub = Date.parse(publishedAt);
  if (Number.isNaN(pub)) return false;
  return now.getTime() - pub <= 2 * 86400000;
}

export async function getWeeklyRecapHighlight(
  now = new Date(),
): Promise<WeeklyRecapHighlight | null> {
  const { weekStart, weekEnd, label } = getTahitiWeekRange(now);
  if (!isWeeklyRecapWeekActive(now, weekStart, weekEnd)) return null;

  const articleSlug = weeklyRecapArticleSlug(weekStart);
  const article = await getArticleBySlug(articleSlug);
  if (!article) return null;

  return {
    active: true,
    articleSlug,
    href: `/actualites/${articleSlug}`,
    label: buildStickerLabel(label),
    isFresh: isFreshWeeklyRecap(article.publishedAt, now),
    weekLabel: label,
    posterImageUrl: resolveGardePosterPublicUrl(article.image ?? null),
  };
}
