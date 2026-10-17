/**
 * Garde week-end — reprise des articles déjà importés depuis la page MooreaNews.
 * Les articles issus de la page Facebook de la commune ne sont pas une source.
 */

import {
  parseGardeFromSiteContent,
  parseDoctorAddressFromText,
  parseDoctorHoursFromText,
  type GardePharmacyHours,
  type ParsedGardeWeekend,
} from "@/lib/garde-announcement-parse";
import { isCommuneGardeSourceUrl } from "@/lib/garde-cleanup";
import { pickBestGardeSnapshot } from "@/lib/garde-moorea-data";
import { pickPublicGardePosterUrl } from "@/lib/garde-poster-url";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSupabase } from "@/lib/supabase/server";

type GardeMooreaSnapshot = ParsedGardeWeekend & {
  sourceUrl?: string;
  syncedAt: string;
  communePosterUrl?: string | null;
  posterImageUrl?: string | null;
  articleSlug?: string;
  doctorAddress?: string;
  doctorHours?: { saturday?: string; sunday?: string };
  pharmacyHours?: GardePharmacyHours[];
};

const GARDE_SLUG_PREFIXES = ["mooreanews-fb-"] as const;
const LOOKBACK_MS = 21 * 86400000;

function stripImportFooter(body: string): string {
  return body.split(/\n---\n\nSource\s*:/)[0]?.trim() ?? body.trim();
}

function isGardeSlug(slug: string): boolean {
  return GARDE_SLUG_PREFIXES.some((p) => slug.startsWith(p));
}

function articleText(row: {
  title: string;
  excerpt: string | null;
  body: string;
}): string {
  const body = stripImportFooter(row.body ?? "");
  return [row.title, row.excerpt, body].filter(Boolean).join("\n\n");
}

function looksLikeGarde(text: string): boolean {
  const n = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return /garde|medecin|pharmacie|week[- ]?end|\bwe\b|docteur/.test(n);
}

function rowToSnapshot(row: {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  published_at: string | null;
  created_at: string | null;
}): GardeMooreaSnapshot | null {
  const text = articleText(row);
  if (!looksLikeGarde(text)) return null;

  const pub = row.published_at ?? row.created_at ?? undefined;
  const cover = row.cover_url?.trim() || null;
  const parsed = parseGardeFromSiteContent(text, pub, Boolean(cover));
  if (!parsed) return null;

  const doctorHours = parseDoctorHoursFromText(text);
  const doctorAddress = parseDoctorAddressFromText(text);
  const fb = text.match(/https?:\/\/(?:www\.)?facebook\.com[^\s)]+/i)?.[0];
  const sourceUrl =
    fb && !isCommuneGardeSourceUrl(fb)
      ? fb
      : `https://www.mooreanews.com/actualites/${row.slug}`;

  return {
    ...parsed,
    pharmacy: null,
    communePosterUrl: null,
    posterImageUrl: pickPublicGardePosterUrl(cover),
    sourceUrl,
    syncedAt: pub ?? new Date().toISOString(),
    articleSlug: row.slug,
    doctorAddress,
    doctorHours:
      doctorHours.saturday || doctorHours.sunday ? doctorHours : undefined,
    pharmacyHours: undefined,
  };
}

export async function fetchGardeFromImportedArticles(
  now = new Date(),
): Promise<GardeMooreaSnapshot | null> {
  const supabase = getAdminSupabase() ?? getPublicSupabase();
  if (!supabase) return null;

  const cutoff = new Date(now.getTime() - LOOKBACK_MS).toISOString();
  const select =
    "slug, title, excerpt, body, cover_url, published_at, created_at";

  const mooreaFb = await supabase
    .from("articles")
    .select(select)
    .eq("published", true)
    .like("slug", "mooreanews-fb-%")
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(40);

  const rows = mooreaFb.data ?? [];

  const candidates: GardeMooreaSnapshot[] = [];

  for (const row of rows ?? []) {
    if (!row.slug || !isGardeSlug(row.slug)) continue;
    const snap = rowToSnapshot(row);
    if (snap) candidates.push(snap);
  }

  return pickBestGardeSnapshot(candidates, now);
}
