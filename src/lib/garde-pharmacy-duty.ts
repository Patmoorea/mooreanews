/**
 * Pharmacie de garde uniquement.
 * Commune (Facebook, RSS, affiche OCR) et autres sources (TNTV, etc.).
 * Le médecin de garde ne passe pas par ici : il reste lu sur le tableau de l'Ordre.
 */

import { GARDE_CACHE_PAYLOAD_SOURCE_ID, GARDE_VEILLE_SOURCE_ID } from "@/lib/card-excerpt";
import {
  MOOREA_PHARMACIES,
  PHARMACY_DUTY_UNLISTED,
  type MooreaPharmacyRecord,
} from "@/data/pharmacies-moorea";
import { parseWeekendDatesFromText } from "@/lib/garde-announcement-parse";
import { expectedWeekend } from "@/lib/garde-official-table";
import { isGardeOcrEnabled, withGardeOcrSession } from "@/lib/garde-poster-ocr";
import { listCommuneMooreaGraphPosts } from "@/lib/facebook-watch";
import { fetchRssFeed } from "@/lib/rss-parser";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSupabase } from "@/lib/supabase/server";

export const COMMUNE_GARDE_RSS_URL = "https://www.commune-moorea.net/feed/";

export { PHARMACY_DUTY_UNLISTED };

export type ParsedPharmacyDuty = {
  pharmacyId: string;
  name: string;
  phone: string;
  phoneHref: string;
  validFrom: string;
  validTo: string;
};

export type PharmacyDuty = ParsedPharmacyDuty & {
  sourceUrl: string;
  sourceLabel: string;
};

type TextSource = {
  text: string;
  sourceUrl: string;
  sourceLabel: string;
};

function fold(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hasAlias(haystack: string, alias: string): boolean {
  const re = new RegExp(`(?:^|[^a-z0-9])${alias}(?:[^a-z0-9]|$)`);
  return re.test(haystack);
}

/** Fenêtre autour de « pharmacie de garde ». Sans ce libellé, pas de pharmacie désignée. */
function gardeWindow(folded: string): string | null {
  const named = folded.match(/pharmacies?\s+de\s+garde/);
  if (named?.index != null) {
    return folded.slice(Math.max(0, named.index - 40), named.index + named[0].length + 90);
  }
  if (!folded.includes("pharmacie")) return null;
  const loose = folded.match(/\bde\s+garde\b/);
  if (loose?.index == null) return null;
  return folded.slice(Math.max(0, loose.index - 80), loose.index + 100);
}

function singlePharmacy(windowText: string): MooreaPharmacyRecord | null {
  const hits = MOOREA_PHARMACIES.filter((pharmacy) =>
    pharmacy.aliases.some((alias) => hasAlias(windowText, alias)),
  );
  if (hits.length !== 1) return null;
  return hits[0] ?? null;
}

/**
 * Dates écrites dans le texte, égales au samedi et au dimanche attendus.
 * La date de publication seule ne suffit pas.
 */
export function weekendDatesClearlyCovered(
  text: string,
  now: Date,
): { validFrom: string; validTo: string } | null {
  const parsed = parseWeekendDatesFromText(text);
  if (!parsed?.validFrom || !parsed.validTo) return null;
  if (parsed.validFrom === parsed.validTo) return null;
  const want = expectedWeekend(now);
  if (parsed.validFrom !== want.validFrom || parsed.validTo !== want.validTo) return null;
  return { validFrom: parsed.validFrom, validTo: parsed.validTo };
}

export function parsePharmacyDutyFromText(text: string, now: Date): ParsedPharmacyDuty | null {
  const dates = weekendDatesClearlyCovered(text, now);
  if (!dates) return null;
  const windowText = gardeWindow(fold(text));
  if (!windowText) return null;
  const pharmacy = singlePharmacy(windowText);
  if (!pharmacy) return null;
  return {
    pharmacyId: pharmacy.id,
    name: pharmacy.name,
    phone: pharmacy.phone,
    phoneHref: pharmacy.phoneHref,
    validFrom: dates.validFrom,
    validTo: dates.validTo,
  };
}

/** Une seule officine citée. Deux sources en désaccord : on n'affiche rien. */
export function selectPharmacyDuty(duties: PharmacyDuty[]): PharmacyDuty | null {
  if (!duties.length) return null;
  const ids = new Set(duties.map((duty) => duty.pharmacyId));
  if (ids.size !== 1) return null;
  return duties[0] ?? null;
}

export function pharmacySourceLabel(url: string, fallback: string): string {
  const u = url.toLowerCase();
  if (u.includes("tntv.pf") || u.includes("tntvnews.pf")) return "TNTV";
  if (u.includes("commune-moorea.net") || u.includes("www.commune-moorea")) {
    return "Commune de Moorea-Maiao";
  }
  if (u.includes("communemooreamaiao") || u.includes("facebook.com") || u.includes("fb.com")) {
    return "Commune de Moorea-Maiao (Facebook)";
  }
  return fallback;
}

function pushDuty(duties: PharmacyDuty[], source: TextSource, now: Date): void {
  const parsed = parsePharmacyDutyFromText(source.text, now);
  if (!parsed) return;
  duties.push({
    ...parsed,
    sourceUrl: source.sourceUrl,
    sourceLabel: source.sourceLabel,
  });
}

function citedSourceUrl(text: string, fallback: string): { sourceUrl: string; sourceLabel: string } {
  const links = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  const cited = links.find((url) =>
    /tntv|tahiti-infos|polynesie|francetvinfo|radio1|outremers|commune-moorea|facebook\.com/i.test(url),
  );
  const sourceUrl = cited ?? fallback;
  return { sourceUrl, sourceLabel: pharmacySourceLabel(sourceUrl, "Source citée") };
}

async function communeFacebookSources(now: Date): Promise<{
  duties: PharmacyDuty[];
  images: Array<{ imageUrl: string; sourceUrl: string }>;
}> {
  const duties: PharmacyDuty[] = [];
  const images: Array<{ imageUrl: string; sourceUrl: string }> = [];
  const posts = await listCommuneMooreaGraphPosts().catch(() => []);
  const cutoff = Date.now() - 21 * 86400000;

  for (const post of posts) {
    const published = Date.parse(post.created_time ?? "");
    if (published && published < cutoff) continue;
    const text = post.message ?? "";
    const sourceUrl = post.permalink_url?.trim() || "https://www.facebook.com/CommuneMooreaMaiao";
    const before = duties.length;
    pushDuty(
      duties,
      { text, sourceUrl, sourceLabel: "Commune de Moorea-Maiao (Facebook)" },
      now,
    );
    const picture = post.full_picture?.trim();
    if (picture && duties.length === before && /garde|pharmacie/i.test(text)) {
      images.push({ imageUrl: picture, sourceUrl });
    }
  }

  return { duties, images: images.slice(0, 3) };
}

async function communeRssDuties(now: Date): Promise<PharmacyDuty[]> {
  const duties: PharmacyDuty[] = [];
  const items = await fetchRssFeed(COMMUNE_GARDE_RSS_URL, { fresh: true }).catch(() => []);
  for (const item of items.slice(0, 40)) {
    pushDuty(
      duties,
      {
        text: `${item.title}\n${item.description}`,
        sourceUrl: item.link || COMMUNE_GARDE_RSS_URL,
        sourceLabel: "Commune de Moorea-Maiao",
      },
      now,
    );
  }
  return duties;
}

async function otherPublishedDuties(now: Date): Promise<PharmacyDuty[]> {
  const supabase = getAdminSupabase() ?? getPublicSupabase();
  if (!supabase) return [];
  const since = new Date(now.getTime() - 21 * 86400000).toISOString();
  const duties: PharmacyDuty[] = [];

  const articles = await supabase
    .from("articles")
    .select("slug, title, excerpt, body")
    .eq("published", true)
    .gte("published_at", since)
    .or("title.ilike.%pharmacie%,body.ilike.%pharmacie%")
    .limit(30);
  for (const row of articles.data ?? []) {
    if (!row.slug || row.slug.startsWith("garde-moorea-")) continue;
    const text = [row.title, row.excerpt, row.body].filter(Boolean).join("\n");
    const cited = citedSourceUrl(text, `https://www.mooreanews.com/actualites/${row.slug}`);
    pushDuty(duties, { text, ...cited }, now);
  }

  const external = await supabase
    .from("external_articles")
    .select("source_id, source_name, url, title, excerpt")
    .eq("hidden", false)
    .gte("published_at", since)
    .or("title.ilike.%pharmacie%,excerpt.ilike.%pharmacie%")
    .limit(40);
  for (const row of external.data ?? []) {
    if (
      row.source_id === GARDE_CACHE_PAYLOAD_SOURCE_ID ||
      row.source_id === GARDE_VEILLE_SOURCE_ID
    ) {
      continue;
    }
    const text = [row.title, row.excerpt].filter(Boolean).join("\n");
    const sourceUrl = row.url || "";
    if (!sourceUrl) continue;
    pushDuty(
      duties,
      {
        text,
        sourceUrl,
        sourceLabel: pharmacySourceLabel(sourceUrl, row.source_name || "Source citée"),
      },
      now,
    );
  }

  return duties;
}

async function ocrPosterDuties(
  images: Array<{ imageUrl: string; sourceUrl: string }>,
  now: Date,
): Promise<PharmacyDuty[]> {
  if (!images.length || !isGardeOcrEnabled()) return [];
  const duties: PharmacyDuty[] = [];
  await withGardeOcrSession(async (session) => {
    for (const image of images) {
      const ocr = await session.recognizeImageUrl(image.imageUrl);
      if (!ocr.ok || !ocr.text) continue;
      pushDuty(
        duties,
        {
          text: ocr.text,
          sourceUrl: image.sourceUrl,
          sourceLabel: "Commune de Moorea-Maiao (affiche)",
        },
        now,
      );
    }
  }).catch(() => undefined);
  return duties;
}

/** Cherche la pharmacie de garde. N'altère jamais le médecin. */
export async function resolveOnDutyPharmacy(now = new Date()): Promise<PharmacyDuty | null> {
  const [facebook, rss, others] = await Promise.all([
    communeFacebookSources(now).catch(() => ({
      duties: [] as PharmacyDuty[],
      images: [] as Array<{ imageUrl: string; sourceUrl: string }>,
    })),
    communeRssDuties(now).catch(() => [] as PharmacyDuty[]),
    otherPublishedDuties(now).catch(() => [] as PharmacyDuty[]),
  ]);
  const fromPosters = await ocrPosterDuties(facebook.images, now).catch(() => [] as PharmacyDuty[]);
  return selectPharmacyDuty([...facebook.duties, ...rss, ...others, ...fromPosters]);
}
