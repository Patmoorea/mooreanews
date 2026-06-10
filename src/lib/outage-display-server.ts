/**
 * Coupure à afficher (hero, bandeau) — lecture rapide depuis alertes DB.
 */

import { dbListActiveAlerts } from "@/lib/supabase/queries";
import { parseOutageDatesFromText } from "@/lib/outage-text-parse";
import {
  pickFeaturedOutage,
  type OutageDisplayRow,
} from "@/lib/outage-display";

export async function getFeaturedOutageForDisplay(): Promise<OutageDisplayRow | null> {
  try {
    const rows = await dbListActiveAlerts();
    if (!rows?.length) return null;

    const outages: OutageDisplayRow[] = [];
    for (const a of rows) {
      if (a.type !== "coupure_edt" && a.type !== "coupure_eau") continue;
      const corpus = `${a.title} ${(a.details ?? "").replace(/<!--outage-sync:[^>]+-->/, "")}`;
      const dates = parseOutageDatesFromText(corpus);
      if (!dates && !a.ends_at) continue;
      outages.push({
        kind: a.type,
        district: a.district,
        commune: "Moorea",
        startsAt: dates?.startsAt ?? a.ends_at!,
        endsAt: dates?.endsAt ?? a.ends_at!,
        title: a.title,
      });
    }
    return pickFeaturedOutage(outages);
  } catch {
    return null;
  }
}
