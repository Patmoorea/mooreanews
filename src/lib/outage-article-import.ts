/**
 * Coupures détectées dans les actualités MooreaNews (Facebook, commune, etc.).
 * Complète les sources officielles EDT / Polynésienne des Eaux.
 */

import { cleanImportedText } from "@/lib/html-entities";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  outageFromText,
  type OutageTextSource,
} from "@/lib/outage-text-parse";
import type { UtilityOutage } from "@/lib/utility-outages";

function corpusNeedsOgEnrich(corpus: string): boolean {
  return (
    (/\.\.\.|…/.test(corpus) || /demain[^0-9]{0,12}$/i.test(corpus.trim())) &&
    !/\d{1,2}h\d{2}/.test(corpus)
  );
}

async function enrichCorpusFromFacebookOg(
  slug: string,
  corpus: string,
): Promise<string> {
  if (!corpusNeedsOgEnrich(corpus)) return corpus;
  const m = slug.match(/-fb-(\d+)-(\d+)$/);
  if (!m) return corpus;

  const [, pageId, postId] = m;
  const { fetchOpenGraph } = await import("@/lib/open-graph");
  const candidates = [
    `https://www.facebook.com/${pageId}/posts/${postId}`,
    `https://www.facebook.com/photo?fbid=${postId}`,
  ];

  for (const url of candidates) {
    try {
      const og = await fetchOpenGraph(url);
      if (!og) continue;
      const merged = cleanImportedText(`${og.title} ${og.description}`).trim();
      if (merged.length > corpus.length + 20) return merged;
    } catch {
      /* ignore */
    }
  }
  return corpus;
}

export async function fetchOutagesFromArticles(): Promise<UtilityOutage[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];

  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("articles")
    .select("slug, title, excerpt, body, published_at")
    .eq("published", true)
    .gte("published_at", since)
    .or(
      "title.ilike.%coupure%,title.ilike.%électricité%,title.ilike.%electricite%,title.ilike.%eau potable%,excerpt.ilike.%coupure%,body.ilike.%coupure%,body.ilike.%Te Ito Rau%,body.ilike.%TE ITO RAU%,slug.ilike.%te-ito-rau%,slug.ilike.%mooreanews-fb%",
    )
    .order("published_at", { ascending: false })
    .limit(40);

  if (!data?.length) return [];

  const outages: UtilityOutage[] = [];

  for (const row of data) {
    let corpus = cleanImportedText(
      `${row.title ?? ""} ${row.excerpt ?? ""} ${row.body ?? ""}`,
    );
    corpus = await enrichCorpusFromFacebookOg(row.slug, corpus);

    const sourceLabel = row.slug.startsWith("te-ito-rau-fb-")
      ? "Te Ito Rau — Facebook"
      : /te ito rau|ito rau no moorea/i.test(corpus)
        ? "Te Ito Rau — Facebook"
        : "MooreaNews — actualités";

    const source: OutageTextSource = {
      id: `article:${row.slug}`,
      title: cleanImportedText(row.title ?? "Coupure programmée").slice(0, 200),
      corpus,
      sourceUrl: `/actualites/${row.slug}`,
      sourceLabel,
    };

    const o = outageFromText(source);
    if (o) outages.push(o);
  }

  return outages;
}
