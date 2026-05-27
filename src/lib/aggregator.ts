/**
 * Aggregator RSS — récupère les flux configurés, filtre par mots-clés
 * Moorea et insère dans la table external_articles.
 */

import { fetchRssFeed, type RssItem } from "@/lib/rss-parser";
import { RSS_SOURCES, type RssSource } from "@/lib/rss-sources";
import { getAdminSupabase } from "@/lib/supabase/admin";

export type AggregationResult = {
  source: string;
  fetched: number;
  matched: number;
  inserted: number;
  errors: string[];
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
    items = await fetchRssFeed(source.url);
  } catch (e) {
    result.errors.push(String(e));
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

  return result;
}

export async function aggregateAll(): Promise<AggregationResult[]> {
  return Promise.all(RSS_SOURCES.map(aggregateOne));
}

/**
 * Récupère les derniers articles externes pour affichage.
 */
export async function listExternalArticles(limit = 20) {
  const supabase = getAdminSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("external_articles")
    .select("*")
    .eq("hidden", false)
    .order("published_at", { ascending: false })
    .limit(limit);
  return data;
}
