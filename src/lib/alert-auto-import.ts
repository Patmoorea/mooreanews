/**
 * Détection d'alertes (météo, EDT, eau, ferry…) depuis la veille RSS.
 * Activé avec AUTO_ALERTS_FROM_VEILLE=true sur Vercel.
 */

import {
  isFacebookPageBoilerplate,
  isFerryPromoArticle,
  isFerryTransportNotice,
} from "@/lib/ferry-notice-detect";
import { MOOREA_KEYWORDS } from "@/lib/rss-sources";
import type { RssItem } from "@/lib/rss-parser";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AlertSeverity, AlertType } from "@/lib/supabase/types";

type DetectedAlert = {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  details: string | null;
  source_url: string;
  urgent: boolean;
  ends_at: string;
};

const MAX_AGE_MS = 48 * 60 * 60 * 1000;
const DEFAULT_DURATION_MS = 24 * 60 * 60 * 1000;

const RULES: {
  type: AlertType;
  severity: AlertSeverity;
  urgent?: boolean;
  pfWide?: boolean;
  keywords: string[];
}[] = [
  {
    type: "coupure_edt",
    severity: "warning",
    pfWide: true,
    keywords: [
      "coupure edt",
      "panne edt",
      "coupure electrique",
      "coupure électrique",
      "coupure de courant",
      "panne de courant",
      "coupure electricite",
    ],
  },
  {
    type: "coupure_eau",
    severity: "warning",
    keywords: [
      "coupure eau",
      "coupure d'eau",
      "coupure d eau",
      "interruption eau",
      "coupure d'eau potable",
    ],
  },
  {
    type: "houle",
    severity: "warning",
    pfWide: true,
    keywords: ["alerte houle", "forte houle", "vagues inhabituelles", "swell"],
  },
  {
    type: "ferry",
    severity: "info",
    pfWide: true,
    keywords: [
      "ferry",
      "traversée",
      "traversée tahiti",
      "annulation ferry",
      "retard ferry",
      "avatea",
      "carénage",
      "carenage",
      "navire",
      "indisponible",
      "perturbation ferry",
      "tauati",
      "aremiti",
    ],
  },
  {
    type: "meteo",
    severity: "warning",
    urgent: true,
    pfWide: true,
    keywords: [
      "alerte meteo",
      "alerte météo",
      "vigilance cyclone",
      "cyclone",
      "tempête tropicale",
      "tempete tropicale",
      "forte pluie",
      "inondation",
    ],
  },
  {
    type: "route",
    severity: "info",
    keywords: [
      "fermeture route",
      "route coupee",
      "route coupée",
      "deviation",
      "déviation",
      "travaux route",
      "circulation alternee",
    ],
  },
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isMooreaRelevant(corpus: string): boolean {
  const n = normalize(corpus);
  return MOOREA_KEYWORDS.some((kw) => n.includes(normalize(kw)));
}

function detectAlertFromItem(item: RssItem): DetectedAlert | null {
  const corpus = `${item.title} ${item.description ?? ""}`.trim();
  if (!corpus) return null;

  const n = normalize(corpus);
  for (const rule of RULES) {
    const hit = rule.keywords.some((kw) => n.includes(normalize(kw)));
    if (!hit) continue;
    if (
      rule.type === "ferry" &&
      (!isFerryTransportNotice(corpus) ||
        isFacebookPageBoilerplate(corpus) ||
        isFerryPromoArticle(corpus))
    ) {
      continue;
    }
    if (!rule.pfWide && !isMooreaRelevant(corpus)) continue;

    const endsAt = new Date(Date.now() + DEFAULT_DURATION_MS).toISOString();
    return {
      type: rule.type,
      severity: rule.severity,
      title: item.title.trim().slice(0, 200),
      details: item.description?.trim().slice(0, 500) || null,
      source_url: item.link,
      urgent: Boolean(rule.urgent),
      ends_at: endsAt,
    };
  }
  return null;
}

function autoAlertsEnabled(): boolean {
  return process.env.AUTO_ALERTS_FROM_VEILLE === "true";
}

/** Crée des alertes actives à partir des items RSS récents (sans doublon par URL). */
export async function importAlertsFromRssItems(
  items: RssItem[],
): Promise<{ created: number; titles: string[] }> {
  if (!autoAlertsEnabled()) return { created: 0, titles: [] };

  const admin = getAdminSupabase();
  if (!admin) return { created: 0, titles: [] };

  const now = Date.now();
  let created = 0;
  const titles: string[] = [];

  for (const item of items) {
    const pubMs = Date.parse(item.publishedAt);
    if (Number.isNaN(pubMs) || now - pubMs > MAX_AGE_MS) continue;

    const detected = detectAlertFromItem(item);
    if (!detected) continue;

    const since = new Date(now - MAX_AGE_MS).toISOString();
    const { data: existing } = await admin
      .from("alerts")
      .select("id")
      .eq("source_url", detected.source_url)
      .gte("created_at", since)
      .maybeSingle();

    if (existing) continue;

    const startsAt = new Date().toISOString();
    const { data: inserted, error } = await admin.from("alerts").insert({
      type: detected.type,
      severity: detected.severity,
      title: detected.title,
      details: detected.details,
      source_url: detected.source_url,
      starts_at: startsAt,
      ends_at: detected.ends_at,
      active: true,
      urgent: detected.urgent,
    }).select("*").single();

    if (!error && inserted) {
      created += 1;
      titles.push(detected.title);
      try {
        const { notifyAlertSubscribers } = await import("@/lib/push-notify");
        await notifyAlertSubscribers(inserted);
      } catch {
        /* non bloquant */
      }
    }
  }

  return { created, titles };
}
