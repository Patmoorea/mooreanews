/**
 * Veille pages web (Open Graph) : mairie, annuaires, sites locaux.
 * Complète RSS + Facebook — pas un crawl complet du net.
 */

import type { AggregationResult } from "@/lib/aggregator";
import { fetchOpenGraph } from "@/lib/open-graph";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  allWebWatchUrls,
  WEB_WATCH_URLS,
} from "@/lib/watch-sources";

function labelForWebUrl(url: string): string {
  return (
    WEB_WATCH_URLS.find((w) => w.url === url)?.label ??
    "Site web — Moorea"
  );
}

function externalIdFromUrl(url: string): string {
  return Buffer.from(url).toString("base64url").slice(0, 120);
}

function isOptionalWebUrl(url: string): boolean {
  return Boolean(WEB_WATCH_URLS.find((w) => w.url === url)?.optional);
}

/** Sonde les URLs web listées (titre / description / image OG). */
export async function aggregateWebPagesWatch(): Promise<AggregationResult> {
  const result: AggregationResult = {
    source: "web-watch",
    fetched: 0,
    matched: 0,
    inserted: 0,
    errors: [],
  };

  const urls = allWebWatchUrls();
  result.fetched = urls.length;

  const supabase = getAdminSupabase();
  if (!supabase) {
    result.errors.push("Supabase not configured");
    return result;
  }

  const rows: {
    source_id: string;
    source_name: string;
    external_id: string;
    url: string;
    title: string;
    excerpt: string | null;
    image_url: string | null;
    published_at: string;
  }[] = [];

  for (const url of urls) {
    const fallbackTitle = labelForWebUrl(url);
    try {
      const og = await fetchOpenGraph(url);
      if (!og?.title && !og?.description) {
        if (!isOptionalWebUrl(url)) {
          result.errors.push(`${url}: pas de métadonnées OG`);
        }
        continue;
      }
      result.matched += 1;
      rows.push({
        source_id: "web-watch",
        source_name: "Sites Moorea — veille",
        external_id: externalIdFromUrl(url),
        url: og.url || url,
        title: og.title?.trim() || fallbackTitle,
        excerpt: og.description || null,
        image_url: og.imageUrl ?? null,
        published_at: new Date().toISOString(),
      });
    } catch (e) {
      result.errors.push(`${url}: ${String(e)}`);
    }
  }

  if (rows.length === 0) return result;

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
