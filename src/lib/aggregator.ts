/**
 * Veille Moorea — flux RSS + liens Facebook / pages Meta (voir facebook-watch.ts).
 */

import { importAlertsFromRssItems } from "@/lib/alert-auto-import";
import { importArticlesFromRssItems } from "@/lib/rss-article-import";
import { facebookImportMaxAgeDays } from "@/lib/facebook-import-filters";
import { aggregateWebWatch } from "@/lib/facebook-watch";
import { fetchRssFeed, type RssItem } from "@/lib/rss-parser";
import { isTransientFeedError } from "@/lib/feed-errors";
import { RSS_SOURCES, rssSourcesByPriority, type RssSource } from "@/lib/rss-sources";
import { ALL_EMPLOYMENT_SOURCE_IDS } from "@/lib/employment-sources";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSupabase } from "@/lib/supabase/server";

export type AggregationResult = {
  source: string;
  fetched: number;
  matched: number;
  inserted: number;
  errors: string[];
  articlesCreated?: number;
  articlesRepaired?: number;
  articlesSkipped?: number;
  eventsCreated?: number;
  announcementsCreated?: number;
  alertsCreated?: number;
  createdAlerts?: string[];
  createdArticles?: { title: string; slug: string }[];
  createdEvents?: { title: string; id: string; date: string }[];
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function matchesSource(item: RssItem, source: RssSource): boolean {
  if (source.acceptAll) return true;
  if (!source.keywords || source.keywords.length === 0) return true;
  const corpus = normalize(`${item.title} ${item.description}`);
  return source.keywords.some((kw) => corpus.includes(normalize(kw)));
}

async function aggregateOne(source: RssSource): Promise<AggregationResult> {
  const result: AggregationResult = {
    source: source.id,
    fetched: 0,
    matched: 0,
    inserted: 0,
    errors: [],
  };

  let items: RssItem[];
  try {
    items = await fetchRssFeed(source.url, { fresh: true });
  } catch (e) {
    const msg = String(e);
    if (!source.optional || !isTransientFeedError(msg)) {
      result.errors.push(msg);
    }
    return result;
  }
  result.fetched = items.length;

  const matching = items.filter((i) => matchesSource(i, source));
  result.matched = matching.length;
  if (matching.length === 0) return result;

  const supabase = getAdminSupabase();
  if (!supabase) {
    result.errors.push("Supabase not configured");
    return result;
  }

  const rows = matching.map((i) => ({
    source_id: source.id,
    source_name: source.name,
    external_id: i.guid,
    url: i.link,
    title: i.title,
    excerpt: i.description || null,
    image_url: i.imageUrl ?? null,
    author: i.author ?? null,
    published_at: i.publishedAt,
  }));

  const { error, count } = await supabase
    .from("external_articles")
    .upsert(rows, { onConflict: "source_id,external_id", count: "exact" });

  if (error) {
    result.errors.push(error.message);
  } else {
    result.inserted = count ?? rows.length;
  }

  try {
    const alertImport = await importAlertsFromRssItems(matching);
    result.alertsCreated = alertImport.created;
    result.createdAlerts = alertImport.titles;
  } catch (e) {
    result.errors.push(`alerts: ${String(e)}`);
  }

  try {
    const articleImport = await importArticlesFromRssItems(matching, source);
    result.articlesCreated = articleImport.created;
    result.articlesSkipped =
      (result.articlesSkipped ?? 0) + articleImport.skipped;
    result.createdArticles = articleImport.createdArticles;
    for (const err of articleImport.errors) {
      result.errors.push(`articles: ${err}`);
    }
  } catch (e) {
    result.errors.push(`articles: ${String(e)}`);
  }

  return result;
}

export async function aggregateAll(): Promise<AggregationResult[]> {
  const sources = rssSourcesByPriority();
  const rss = await Promise.all(sources.map(aggregateOne));
  const web = await aggregateWebWatch();
  return [...rss, ...web];
}

/**
 * Récupère les derniers articles externes pour affichage.
 */
export async function listExternalArticles(limit = 20) {
  const supabase = getPublicSupabase() ?? getAdminSupabase();
  if (!supabase) return null;

  const cutoff = new Date(
    Date.now() - facebookImportMaxAgeDays() * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("external_articles")
    .select("*")
    .eq("hidden", false)
    .not(
      "source_id",
      "in",
      `(${ALL_EMPLOYMENT_SOURCE_IDS.map((id) => `"${id}"`).join(",")})`,
    )
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return null;
  return data;
}
