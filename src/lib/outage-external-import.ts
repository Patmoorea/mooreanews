/**
 * Coupures détectées dans external_articles + Google News RSS (live).
 */

import { fetchRssFeed } from "@/lib/rss-parser";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { outageFromText } from "@/lib/outage-text-parse";
import type { UtilityOutage } from "@/lib/utility-outages";

const GOOGLE_NEWS_COUPURES_URL =
  "https://news.google.com/rss/search?q=coupure+%C3%A9lectricit%C3%A9+OR+coupure+eau+Moorea+Maiao&hl=fr&gl=PF&ceid=PF:fr";

export async function fetchOutagesFromExternalArticles(): Promise<UtilityOutage[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];

  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("external_articles")
    .select("source_id, source_name, external_id, url, title, excerpt, published_at")
    .gte("published_at", since)
    .or(
      "title.ilike.%coupure%,excerpt.ilike.%coupure%,title.ilike.%électricité%,title.ilike.%electricite%,title.ilike.%eau potable%,excerpt.ilike.%Te Ito Rau%,title.ilike.%Te Ito Rau%",
    )
    .order("published_at", { ascending: false })
    .limit(40);

  if (!data?.length) return [];

  const outages: UtilityOutage[] = [];
  for (const row of data) {
    const corpus = `${row.title ?? ""} ${row.excerpt ?? ""}`.trim();
    const o = outageFromText({
      id: `ext:${row.source_id}:${row.external_id}`,
      title: row.title ?? "Coupure programmée",
      corpus,
      sourceUrl: row.url,
      sourceLabel: row.source_name ?? "Veille externe",
    });
    if (o) outages.push(o);
  }
  return outages;
}

export async function fetchOutagesFromGoogleNewsRss(): Promise<UtilityOutage[]> {
  try {
    const items = await fetchRssFeed(GOOGLE_NEWS_COUPURES_URL, { fresh: true });
    const outages: UtilityOutage[] = [];

    for (const item of items.slice(0, 25)) {
      const corpus = `${item.title} ${item.description ?? ""}`.trim();
      const o = outageFromText({
        id: `gnews:${item.guid}`,
        title: item.title,
        corpus,
        sourceUrl: item.link,
        sourceLabel: "Google Actualités",
      });
      if (o) outages.push(o);
    }
    return outages;
  } catch {
    return [];
  }
}

export async function fetchOutagesFromLiveVeille(): Promise<UtilityOutage[]> {
  const [ext, rss] = await Promise.all([
    fetchOutagesFromExternalArticles(),
    fetchOutagesFromGoogleNewsRss(),
  ]);
  return [...ext, ...rss];
}
