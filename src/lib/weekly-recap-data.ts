/**
 * Données récap semaine Moorea (lundi → dimanche, heure Tahiti).
 */

import { getArticles, getEventsBetween } from "@/lib/content";
import { tahitiDateKey, tahitiParts } from "@/lib/tahiti-holidays";

export type WeeklyRecapArticle = {
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
};

export type WeeklyRecapEvent = {
  slug: string;
  title: string;
  date: string;
  location: string;
  time?: string;
};

export type WeeklyRecapSnapshot = {
  weekStart: string;
  weekEnd: string;
  label: string;
  articles: WeeklyRecapArticle[];
  events: WeeklyRecapEvent[];
  posterImageUrl?: string | null;
  articleSlug: string;
  syncedAt: string;
};

function addDaysKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return dt.toISOString().slice(0, 10);
}

export function weeklyRecapArticleSlug(weekStart: string): string {
  return `agenda-semaine-${weekStart}`;
}

export function getTahitiWeekRange(now = new Date()): {
  weekStart: string;
  weekEnd: string;
  label: string;
} {
  const today = tahitiDateKey(now);
  const { dow } = tahitiParts(now);
  const daysSinceMonday = (dow + 6) % 7;
  const weekStart = addDaysKey(today, -daysSinceMonday);
  const weekEnd = addDaysKey(weekStart, 6);
  return { weekStart, weekEnd, label: formatWeekLabel(weekStart, weekEnd) };
}

function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const startLabel = new Date(`${weekStart}T12:00:00Z`).toLocaleDateString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    day: "numeric",
    month: "long",
  });
  const endLabel = new Date(`${weekEnd}T12:00:00Z`).toLocaleDateString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

/** Affiche active du lundi au dimanche de la semaine publiée. */
export function isWeeklyRecapWeekActive(
  now: Date,
  weekStart: string,
  weekEnd: string,
): boolean {
  const today = tahitiDateKey(now);
  return today >= weekStart && today <= weekEnd;
}

function formatEventDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export async function buildWeeklyRecapSnapshotForWeekStart(
  weekStart: string,
): Promise<WeeklyRecapSnapshot> {
  const weekEnd = addDaysKey(weekStart, 6);
  const label = formatWeekLabel(weekStart, weekEnd);
  const lookbackStart = addDaysKey(weekStart, -7);

  const [allArticles, weekEvents] = await Promise.all([
    getArticles(),
    getEventsBetween(weekStart, weekEnd),
  ]);

  const articles = allArticles
    .filter((a) => {
      const pub = a.publishedAt.slice(0, 10);
      return pub >= lookbackStart && pub <= weekEnd;
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    })
    .slice(0, 6)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      publishedAt: a.publishedAt,
    }));

  const events = weekEvents
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
    .slice(0, 8)
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      date: formatEventDate(e.date),
      location: e.district ?? e.location,
      time: e.time,
    }));

  return {
    weekStart,
    weekEnd,
    label,
    articles,
    events,
    articleSlug: weeklyRecapArticleSlug(weekStart),
    syncedAt: new Date().toISOString(),
  };
}

export async function buildWeeklyRecapSnapshot(
  now = new Date(),
): Promise<WeeklyRecapSnapshot> {
  const { weekStart } = getTahitiWeekRange(now);
  return buildWeeklyRecapSnapshotForWeekStart(weekStart);
}

export function weeklyRecapHasContent(snap: WeeklyRecapSnapshot): boolean {
  return snap.articles.length > 0 || snap.events.length > 0;
}
