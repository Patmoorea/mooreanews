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
    const corpus = cleanImportedText(
      `${row.title ?? ""} ${row.excerpt ?? ""} ${row.body ?? ""}`,
    );

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
