/**
 * Veille automatique garde Moorea — Facebook commune (+ cache Supabase).
 */

import path from "path";
import { access } from "fs/promises";
import { unstable_cache } from "next/cache";
import { listCommuneMooreaGraphPosts } from "@/lib/facebook-watch";
import {
  inferWeekendFromPostDate,
  isGardeImagePost,
  mergeGardeOcrIntoSnapshot,
  parseGardePost,
  type ParsedGardeWeekend,
  type GardePharmacyHours,
} from "@/lib/garde-announcement-parse";
import { ocrGardePosterImage } from "@/lib/garde-poster-ocr";
import {
  gardePosterHasContent,
  renderAndUploadMooreaNewsGardePoster,
} from "@/lib/garde-weekend-poster-sync";
import {
  isGardeWeekActive,
  pickBestGardeSnapshot,
  readGardeFileSnapshot,
} from "@/lib/garde-moorea-data";
import { MOOREA_PHARMACIES } from "@/lib/moorea-pharmacies";
import {
  gardeArticleSlug,
  upsertGardeWeekendArticle,
} from "@/lib/garde-weekend-article";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { OnCallDuty } from "@/lib/health-on-call-shared";

export const GARDE_CACHE_SOURCE_ID = "moorea-garde-weekend";
const GARDE_CACHE_EXTERNAL_ID = "current";
const COMMUNE_FB = "https://www.facebook.com/CommuneMooreaMaiao";

export type { GardePharmacyHours } from "@/lib/garde-announcement-parse";

export type GardeMooreaSnapshot = ParsedGardeWeekend & {
  sourceUrl?: string;
  syncedAt: string;
  communePosterUrl?: string | null;
  posterImageUrl?: string | null;
  articleSlug?: string;
  doctorAddress?: string;
  doctorHours?: { saturday?: string; sunday?: string };
  pharmacyHours?: GardePharmacyHours[];
};

function toDuty(
  kind: "pharmacy" | "doctor",
  entry: { name: string; phone: string; phoneHref: string } | null,
  source: string,
  sourceUrl?: string,
  address?: string,
): OnCallDuty | null {
  if (!entry?.name) return null;
  if (kind === "doctor") {
    return {
      name: entry.name.startsWith("Dr") ? entry.name : `Dr ${entry.name}`,
      phone: entry.phone,
      phoneHref: entry.phoneHref,
      address,
      source,
      sourceUrl,
    };
  }
  const ph = MOOREA_PHARMACIES.find((p) => p.name === entry.name);
  return {
    name: entry.name,
    phone: entry.phone,
    phoneHref: entry.phoneHref,
    address: ph?.address ?? address,
    source,
    sourceUrl,
  };
}

function snapshotToDuties(
  snap: GardeMooreaSnapshot,
  now: Date,
): { pharmacy: OnCallDuty | null; doctor: OnCallDuty | null; weekendLabel: string | null } {
  if (!isGardeWeekActive(now, snap.validFrom, snap.validTo)) {
    return { pharmacy: null, doctor: null, weekendLabel: null };
  }

  const source = "Commune Moorea-Maiao";
  return {
    weekendLabel: snap.label,
    pharmacy: toDuty("pharmacy", snap.pharmacy, source, snap.sourceUrl),
    doctor: toDuty(
      "doctor",
      snap.doctor,
      source,
      snap.sourceUrl,
      snap.doctorAddress,
    ),
  };
}

function parseCommunePostToSnapshot(
  post: {
    created_time?: string;
    message?: string;
    permalink_url?: string;
    full_picture?: string;
  },
): GardeMooreaSnapshot | null {
  const msg = post.message ?? "";
  const picture = post.full_picture?.trim() || null;
  let parsed = parseGardePost(msg, post.created_time);

  if (!parsed && picture && isGardeImagePost(msg, post.created_time, true)) {
    const inferred = post.created_time
      ? inferWeekendFromPostDate(post.created_time)
      : null;
    if (inferred) {
      parsed = { ...inferred, doctor: null, pharmacy: null };
    }
  }

  if (!parsed) {
    const partial = parseGardePost(msg);
    const inferred =
      partial && post.created_time
        ? inferWeekendFromPostDate(post.created_time)
        : null;
    if (partial && inferred) {
      parsed = { ...inferred, ...partial };
    }
  }

  const hasContent =
    parsed &&
    (parsed.doctor ||
      parsed.pharmacy ||
      (picture && isGardeImagePost(msg, post.created_time, true)));

  if (!hasContent || !parsed) return null;

  return {
    ...parsed,
    communePosterUrl: picture,
    posterImageUrl: null,
    sourceUrl: post.permalink_url ?? COMMUNE_FB,
    syncedAt: new Date().toISOString(),
  };
}

async function fetchGardeFromCommuneFacebook(): Promise<GardeMooreaSnapshot | null> {
  const posts = await listCommuneMooreaGraphPosts();
  const cutoff = Date.now() - 21 * 86400000;
  const now = new Date();
  const candidates: GardeMooreaSnapshot[] = [];

  for (const post of posts) {
    const t = Date.parse(post.created_time ?? "");
    if (t && t < cutoff) continue;

    const snap = parseCommunePostToSnapshot(post);
    if (snap) candidates.push(snap);
  }

  return pickBestGardeSnapshot(candidates, now);
}

async function fetchCommuneRssGarde(): Promise<GardeMooreaSnapshot | null> {
  try {
    const res = await fetch("https://www.commune-moorea.net/feed/", {
      headers: { Accept: "application/rss+xml" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const xml = await res.text();
    for (const item of xml.split("<item>").slice(1, 40)) {
      const titleM = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const descM = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
      const dateM = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const linkM = item.match(/<link>([\s\S]*?)<\/link>/);
      const text = `${titleM?.[1] ?? ""} ${descM?.[1] ?? ""}`;
      const pub = dateM?.[1] ? new Date(dateM[1]).toISOString() : undefined;
      const parsed = parseGardePost(text, pub);
      if (!parsed || (!parsed.doctor && !parsed.pharmacy)) continue;
      return {
        ...parsed,
        sourceUrl: linkM?.[1]?.trim() ?? "https://www.commune-moorea.net",
        syncedAt: new Date().toISOString(),
      };
    }
  } catch {
    /* optionnel */
  }
  return null;
}

export async function fetchLiveGardeMooreaSnapshot(): Promise<GardeMooreaSnapshot | null> {
  const [fb, rss] = await Promise.all([
    fetchGardeFromCommuneFacebook(),
    fetchCommuneRssGarde(),
  ]);
  const candidates = [fb, rss].filter(Boolean) as GardeMooreaSnapshot[];
  return pickBestGardeSnapshot(candidates);
}

const getCachedLiveGarde = unstable_cache(
  () => fetchLiveGardeMooreaSnapshot(),
  ["garde-moorea-live"],
  { revalidate: 3600, tags: ["garde-moorea"] },
);

export async function readGardeMooreaFromCache(): Promise<GardeMooreaSnapshot | null> {
  const supabase = getPublicSupabase() ?? getAdminSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("external_articles")
    .select("excerpt, url, fetched_at, image_url")
    .eq("source_id", GARDE_CACHE_SOURCE_ID)
    .eq("external_id", GARDE_CACHE_EXTERNAL_ID)
    .eq("hidden", false)
    .maybeSingle();

  if (!data?.excerpt) return null;

  try {
    const snap = JSON.parse(data.excerpt) as GardeMooreaSnapshot;
    if (!snap.validFrom || !snap.validTo) return null;
    snap.sourceUrl = data.url ?? snap.sourceUrl;
    snap.syncedAt = data.fetched_at ?? snap.syncedAt;
    if (!snap.posterImageUrl && data.image_url) {
      snap.posterImageUrl = data.image_url;
    }
    return snap;
  } catch {
    return null;
  }
}

export async function writeGardeMooreaCache(snap: GardeMooreaSnapshot): Promise<boolean> {
  const supabase = getAdminSupabase();
  if (!supabase) return false;

  const title =
    [snap.pharmacy?.name, snap.doctor?.name].filter(Boolean).join(" · ") || "Garde Moorea";
  const { error } = await supabase.from("external_articles").upsert(
    {
      source_id: GARDE_CACHE_SOURCE_ID,
      source_name: "Garde Moorea (auto)",
      external_id: GARDE_CACHE_EXTERNAL_ID,
      url: snap.sourceUrl ?? COMMUNE_FB,
      title: title.slice(0, 500),
      excerpt: JSON.stringify(snap).slice(0, 8000),
      image_url: snap.posterImageUrl ?? null,
      author: "Commune Moorea-Maiao",
      published_at: `${snap.validFrom}T12:00:00.000Z`,
      fetched_at: snap.syncedAt,
      hidden: false,
    },
    { onConflict: "source_id,external_id" },
  );

  return !error;
}

async function localGardePosterPath(validFrom: string): Promise<string | null> {
  const rel = `/images/garde/garde-${validFrom}.png`;
  const full = path.join(process.cwd(), "public", "images/garde", `garde-${validFrom}.png`);
  try {
    await access(full);
    return rel;
  } catch {
    return null;
  }
}

async function resolveSnapshotForSync(): Promise<GardeMooreaSnapshot | null> {
  const [live, file] = await Promise.all([
    fetchLiveGardeMooreaSnapshot().catch(() => null),
    readGardeFileSnapshot(),
  ]);

  const now = new Date();
  const fileCandidate =
    file && isGardeWeekActive(now, file.validFrom, file.validTo) ? file : null;

  const best = pickBestGardeSnapshot(
    [live, fileCandidate].filter(Boolean) as GardeMooreaSnapshot[],
    now,
  );

  if (!best) return null;

  if (fileCandidate && fileCandidate.validFrom === best.validFrom) {
    return {
      ...best,
      communePosterUrl:
        live?.communePosterUrl ??
        best.communePosterUrl ??
        (best.posterImageUrl?.startsWith("http") ? best.posterImageUrl : null),
      sourceUrl: live?.sourceUrl ?? best.sourceUrl,
      syncedAt: new Date().toISOString(),
    };
  }

  return best;
}

async function enrichFromCommuneImage(
  snap: GardeMooreaSnapshot,
  runOcr: boolean,
): Promise<{ snap: GardeMooreaSnapshot; ocrUsed: boolean; ocrError?: string }> {
  const imageUrl = snap.communePosterUrl ?? null;
  if (!runOcr || !imageUrl) return { snap, ocrUsed: false };

  const needsOcr =
    !snap.doctor?.name ||
    !snap.pharmacyHours?.length ||
    !snap.doctorHours?.saturday;

  if (!needsOcr) return { snap, ocrUsed: false };

  const ocr = await ocrGardePosterImage(imageUrl);
  if (!ocr.ok || !ocr.text) {
    return { snap, ocrUsed: false, ocrError: ocr.error ?? "ocr vide" };
  }

  return {
    snap: mergeGardeOcrIntoSnapshot(snap, ocr.text),
    ocrUsed: true,
  };
}

export type GardeSyncOptions = {
  /** Vendredi matin : OCR affiche commune + affiche MooreaNews */
  fullWeekendPipeline?: boolean;
};

export async function syncGardeMooreaFromCommune(
  options: GardeSyncOptions = {},
): Promise<{
  ok: boolean;
  found: boolean;
  pharmacy: string | null;
  doctor: string | null;
  weekend: string | null;
  articleSlug: string | null;
  ocrUsed: boolean;
  posterGenerated: boolean;
  ocrError?: string;
  articleCreated?: boolean;
  articleUpdated?: boolean;
  articleError?: string;
  posterUrl?: string | null;
}> {
  let snap: GardeMooreaSnapshot | null = null;
  try {
    snap = await resolveSnapshotForSync();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      found: false,
      pharmacy: null,
      doctor: null,
      weekend: null,
      articleSlug: null,
      ocrUsed: false,
      posterGenerated: false,
      ocrError: msg.slice(0, 200),
    };
  }

  if (!snap) {
    return {
      ok: true,
      found: false,
      pharmacy: null,
      doctor: null,
      weekend: null,
      articleSlug: null,
      ocrUsed: false,
      posterGenerated: false,
    };
  }

  const now = new Date();
  if (!isGardeWeekActive(now, snap.validFrom, snap.validTo)) {
    return {
      ok: true,
      found: false,
      pharmacy: null,
      doctor: null,
      weekend: snap.label,
      articleSlug: gardeArticleSlug(snap.validFrom),
      ocrUsed: false,
      posterGenerated: false,
    };
  }

  if (!snap.communePosterUrl && snap.posterImageUrl?.startsWith("http")) {
    snap.communePosterUrl = snap.posterImageUrl;
  }

  const enriched = await enrichFromCommuneImage(
    snap,
    Boolean(options.fullWeekendPipeline),
  );
  snap = enriched.snap;

  const shouldMakePoster =
    options.fullWeekendPipeline ||
    !snap.posterImageUrl ||
    snap.posterImageUrl.startsWith("/");

  if (shouldMakePoster && gardePosterHasContent(snap)) {
    const mooreaPoster = await renderAndUploadMooreaNewsGardePoster(snap);
    if (mooreaPoster) {
      snap.posterImageUrl = mooreaPoster;
    } else {
      const local = await localGardePosterPath(snap.validFrom);
      snap.posterImageUrl =
        local ?? snap.communePosterUrl ?? snap.posterImageUrl;
    }
  }

  snap.syncedAt = new Date().toISOString();
  const article = await upsertGardeWeekendArticle(snap);
  snap.articleSlug = article.slug;

  await writeGardeMooreaCache(snap);

  return {
    ok: true,
    found: true,
    pharmacy: snap.pharmacy?.name ?? null,
    doctor: snap.doctor?.name ?? null,
    weekend: snap.label,
    articleSlug: snap.articleSlug ?? gardeArticleSlug(snap.validFrom),
    ocrUsed: enriched.ocrUsed,
    posterGenerated: Boolean(snap.posterImageUrl),
    ocrError: enriched.ocrError,
    articleCreated: article.created,
    articleUpdated: article.updated,
    articleError: article.error,
    posterUrl: snap.posterImageUrl ?? null,
  };
}

export async function resolveGardeMooreaAuto(now = new Date()): Promise<{
  pharmacy: OnCallDuty | null;
  doctor: OnCallDuty | null;
  weekendLabel: string | null;
}> {
  const snap = await readGardeMooreaFromCache();
  if (!snap) {
    return { pharmacy: null, doctor: null, weekendLabel: null };
  }

  return snapshotToDuties(snap, now);
}

/** Export cron uniquement — ne pas appeler depuis les pages. */
export { getCachedLiveGarde };
