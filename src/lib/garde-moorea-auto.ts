/**
 * Veille automatique garde Moorea — Facebook commune (+ cache Supabase).
 */

import path from "path";
import { access } from "fs/promises";
import { unstable_cache } from "next/cache";
import { listCommuneMooreaGraphPosts, listMooreaNewsGraphPosts } from "@/lib/facebook-watch";
import {
  inferWeekendFromPostDate,
  isGardeImagePost,
  isMooreaGardeDoctor,
  mergeGardeOcrIntoSnapshot,
  parseGardeFromSiteContent,
  parseGardePost,
  type ParsedGardeWeekend,
  type GardePharmacyHours,
} from "@/lib/garde-announcement-parse";
import { fetchGardeFromImportedArticles } from "@/lib/garde-site-articles";
import {
  COPPF_MEDECINS_GARDE_URL,
  fetchCoppfGardeImageUrl,
  fetchCoppfGardeSnapshot,
} from "@/lib/garde-ordre-pharmaciens";
import { withGardeOcrSession } from "@/lib/garde-poster-ocr";
import {
  gardePosterHasContent,
  renderAndUploadMooreaNewsGardePoster,
} from "@/lib/garde-weekend-poster-sync";
import {
  isGardeWeekActive,
  isGardeWeekRelevant,
  pickBestGardeSnapshot,
  readGardeFileSnapshot,
} from "@/lib/garde-moorea-data";
import { mergeGardeSnapshots } from "@/lib/garde-ordre-pharmaciens";
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

function pharmacyDutyFromSnapshot(
  snap: GardeMooreaSnapshot,
  source: string,
): OnCallDuty | null {
  if (snap.pharmacy?.name) {
    return toDuty("pharmacy", snap.pharmacy, source, snap.sourceUrl);
  }
  const hours = snap.pharmacyHours;
  if (!hours?.length) return null;
  const summary = hours
    .map((h) => `${h.district} ${h.phone}`)
    .join(" · ");
  const first = hours[0]!;
  return {
    name: "Pharmacies de garde (Afareaitu, Maharepa, Haapiti)",
    phone: first.phone,
    phoneHref: first.phone ? phoneHref(first.phone) : "",
    address: summary,
    source,
    sourceUrl: snap.sourceUrl,
  };
}

/** Médecin / pharmacie affichés sur le site à partir du snapshot garde. */
export function snapshotToPublicDuties(
  snap: GardeMooreaSnapshot,
  now: Date,
): { pharmacy: OnCallDuty | null; doctor: OnCallDuty | null; weekendLabel: string | null } {
  if (!isGardeWeekActive(now, snap.validFrom, snap.validTo)) {
    return { pharmacy: null, doctor: null, weekendLabel: null };
  }

  const source = snap.sourceUrl?.includes("ordre-pharmaciens")
    ? "Ordre des médecins (COPPF)"
    : "Commune Moorea-Maiao";
  return {
    weekendLabel: snap.label,
    pharmacy: pharmacyDutyFromSnapshot(snap, source),
    doctor: toDuty(
      "doctor",
      snap.doctor,
      source,
      snap.sourceUrl,
      snap.doctorAddress,
    ),
  };
}

function phoneHref(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("689") && d.length >= 11) d = d.slice(3);
  if (d.length < 8) return "";
  d = d.slice(-8);
  return `tel:+689${d}`;
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
    parsed = parseGardeFromSiteContent(msg, post.created_time, true);
  }

  if (!parsed) {
    const partial = parseGardeFromSiteContent(msg, post.created_time, Boolean(picture));
    if (partial) parsed = partial;
  }

  if (!parsed && picture && post.created_time) {
    const weekend = inferWeekendFromPostDate(post.created_time);
    if (weekend) {
      parsed = {
        validFrom: weekend.validFrom,
        validTo: weekend.validTo,
        label: weekend.label,
        doctor: null,
        pharmacy: null,
      };
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

async function fetchGardeFromFacebookPages(): Promise<GardeMooreaSnapshot | null> {
  const [communePosts, mooreaNewsPosts] = await Promise.all([
    listCommuneMooreaGraphPosts(),
    listMooreaNewsGraphPosts(),
  ]);
  const posts = [...communePosts, ...mooreaNewsPosts];
  const cutoff = Date.now() - 21 * 86400000;
  const now = new Date();
  const candidates: GardeMooreaSnapshot[] = [];
  const seen = new Set<string>();

  for (const post of posts) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);

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
  const [coppf, site, fb, rss] = await Promise.all([
    fetchCoppfGardeSnapshot().catch(() => null),
    fetchGardeFromImportedArticles().catch(() => null),
    fetchGardeFromFacebookPages().catch(() => null),
    fetchCommuneRssGarde().catch(() => null),
  ]);
  const candidates = [coppf, site, fb, rss].filter(Boolean) as GardeMooreaSnapshot[];
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
    file && isGardeWeekRelevant(now, file.validFrom, file.validTo) ? file : null;

  const coppf = await fetchCoppfGardeSnapshot(now).catch(() => null);
  const best = pickBestGardeSnapshot(
    [coppf, live, fileCandidate].filter(Boolean) as GardeMooreaSnapshot[],
    now,
  );

  if (!best) return null;

  let merged = best;
  for (const c of [coppf, live, fileCandidate].filter(Boolean) as GardeMooreaSnapshot[]) {
    if (c.validFrom === merged.validFrom) {
      merged = mergeGardeSnapshots(merged, c);
    }
  }
  if (fileCandidate && fileCandidate.validFrom === merged.validFrom) {
    merged = mergeGardeSnapshots(merged, fileCandidate);
  }
  return {
    ...merged,
    communePosterUrl:
      live?.communePosterUrl ??
      merged.communePosterUrl ??
      (merged.posterImageUrl?.startsWith("http") ? merged.posterImageUrl : null),
    sourceUrl: live?.sourceUrl ?? merged.sourceUrl,
    syncedAt: new Date().toISOString(),
  };
}

async function enrichFromPosterOcr(
  snap: GardeMooreaSnapshot,
  runOcr: boolean,
): Promise<{ snap: GardeMooreaSnapshot; ocrUsed: boolean; ocrError?: string }> {
  const needsOcr =
    runOcr &&
    (!snap.doctor?.name ||
      !isMooreaGardeDoctor(snap.doctor) ||
      !snap.pharmacyHours?.length ||
      !snap.doctorHours?.saturday);

  if (!needsOcr) return { snap, ocrUsed: false };

  const coppfMeta = await fetchCoppfGardeImageUrl().catch(() => null);
  if (
    coppfMeta?.imageUrl &&
    !snap.communePosterUrl?.includes("ordre-pharmaciens")
  ) {
    snap = {
      ...snap,
      communePosterUrl: snap.communePosterUrl ?? coppfMeta.imageUrl,
      sourceUrl: snap.sourceUrl ?? COPPF_MEDECINS_GARDE_URL,
    };
  }

  const urls: string[] = [];
  const add = (url: string | null | undefined) => {
    if (url && !urls.includes(url)) urls.push(url);
  };
  add(snap.communePosterUrl);
  add(coppfMeta?.imageUrl);
  if (snap.posterImageUrl?.startsWith("http")) add(snap.posterImageUrl);

  if (!urls.length) {
    return { snap, ocrUsed: false, ocrError: "aucune image affiche" };
  }

  let ocrUsed = false;
  let ocrError: string | undefined;
  let working = snap;

  await withGardeOcrSession(async (session) => {
    for (const url of urls) {
      const ocr = await session.recognizeImageUrl(url);
      if (ocr.ok && ocr.text) {
        working = mergeGardeOcrIntoSnapshot(working, ocr.text);
        ocrUsed = true;
        if (working.doctor?.name && (working.pharmacyHours?.length ?? 0) > 0) {
          break;
        }
      } else if (!ocrError) {
        ocrError = ocr.error ?? `ocr vide (${url.slice(0, 80)})`;
      }
    }
  });

  return { snap: working, ocrUsed, ocrError };
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
  if (!isGardeWeekRelevant(now, snap.validFrom, snap.validTo)) {
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

  const ocrEnriched = await enrichFromPosterOcr(
    snap,
    Boolean(options.fullWeekendPipeline) || !snap.doctor?.name,
  );
  snap = ocrEnriched.snap;

  const ocrUsed = ocrEnriched.ocrUsed;
  const ocrError = ocrEnriched.ocrError;

  const shouldMakePoster =
    options.fullWeekendPipeline ||
    !snap.posterImageUrl ||
    snap.posterImageUrl.startsWith("/") ||
    Boolean(snap.doctor?.name || snap.pharmacy?.name);

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

  const fileSnap = await readGardeFileSnapshot();
  if (fileSnap?.validFrom === snap.validFrom) {
    snap = mergeGardeSnapshots(snap, fileSnap);
  }

  snap.syncedAt = new Date().toISOString();

  const article = await upsertGardeWeekendArticle(snap);
  snap.articleSlug = article.slug;
  const articleCreated = article.created;
  const articleUpdated = article.updated;
  const articleError = article.error;

  await writeGardeMooreaCache(snap);

  return {
    ok: true,
    found: true,
    pharmacy: snap.pharmacy?.name ?? null,
    doctor: snap.doctor?.name ?? null,
    weekend: snap.label,
    articleSlug: snap.articleSlug ?? gardeArticleSlug(snap.validFrom),
    ocrUsed,
    posterGenerated: Boolean(snap.posterImageUrl),
    ocrError,
    articleCreated,
    articleUpdated,
    articleError,
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

  return snapshotToPublicDuties(snap, now);
}

/** Export cron uniquement — ne pas appeler depuis les pages. */
export { getCachedLiveGarde };
