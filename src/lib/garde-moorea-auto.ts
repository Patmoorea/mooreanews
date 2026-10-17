/**
 * Veille automatique garde Moorea — tableau officiel de l'Ordre des médecins
 * (page COPPF) + cache Supabase.
 * La page Facebook, les affiches et le RSS de la commune ne sont pas des sources.
 */

import path from "path";
import { access } from "fs/promises";
import { unstable_cache } from "next/cache";
import { listMooreaNewsGraphPosts } from "@/lib/facebook-watch";
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
  fetchCoppfGardeImageUrls,
  fetchCoppfGardeSnapshot,
} from "@/lib/garde-ordre-pharmaciens";
import { isGardeOcrEnabled, withGardeOcrSession } from "@/lib/garde-poster-ocr";
import { validateOfficialMooreaGarde, type GardeValidation } from "@/lib/garde-official-table";

/** Validation finale avant publication (article, cache, image). */
export function validateGardeBeforePublish(
  snap: GardeMooreaSnapshot,
  now: Date,
): GardeValidation {
  if (!isPlausibleGardeDates(snap.validFrom, snap.validTo, now)) {
    return { ok: false, issues: [`dates invraisemblables ${snap.validFrom}/${snap.validTo}`] };
  }
  const holiday = snap.validFrom === snap.validTo;
  const allow = holiday ? { validFrom: snap.validFrom, validTo: snap.validTo } : undefined;
  if (snap.officialCheck) {
    const v = validateOfficialMooreaGarde(snap.officialCheck, now, allow);
    // Le snapshot final doit être identique à la ligne officielle (pas de cache périmé fusionné).
    if (snap.doctor?.phone !== snap.officialCheck.phone || snap.doctor?.name !== snap.officialCheck.doctorName) {
      v.issues.push("données finales ≠ ligne Moorea du tableau officiel");
      v.ok = false;
    }
    return v;
  }
  return {
    ok: false,
    issues: ["tableau officiel non lu (OCR indisponible) — rien n'est publié sans vérification"],
  };
}
import {
  gardePosterHasContent,
  renderAndUploadMooreaNewsGardePoster,
} from "@/lib/garde-weekend-poster-sync";
import {
  isGardeWeekRelevant,
  pickBestGardeSnapshot,
  readGardeFileSnapshot,
} from "@/lib/garde-moorea-data";
import { mergeGardeSnapshots } from "@/lib/garde-ordre-pharmaciens";
import { MOOREA_PHARMACIES } from "@/lib/moorea-pharmacies";
import { isCommuneGardeSourceUrl, isPlausibleGardeDates } from "@/lib/garde-cleanup";
import {
  isCommuneOrFacebookGardeAsset,
  pickPublicGardePosterUrl,
} from "@/lib/garde-poster-url";
import {
  gardeArticleSlug,
  upsertGardeWeekendArticle,
} from "@/lib/garde-weekend-article";
import {
  GARDE_CACHE_PAYLOAD_SOURCE_ID,
  GARDE_VEILLE_SOURCE_ID,
  gardeCachePublicExcerpt,
  parseGardeSnapshotJson,
} from "@/lib/card-excerpt";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { OnCallDuty } from "@/lib/health-on-call-shared";

export const GARDE_CACHE_SOURCE_ID = GARDE_VEILLE_SOURCE_ID;
export { GARDE_CACHE_PAYLOAD_SOURCE_ID };
const GARDE_CACHE_EXTERNAL_ID = "current";
const VERIFIED_PHARMACY_SOURCE = "ordre-pharmaciens-polynesie.com/pharmacies-de-garde";

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
  /** Ligne Moorea lue sur le tableau officiel (pour la validation avant publication). */
  officialCheck?: import("@/lib/garde-official-table").OfficialMooreaGarde;
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

/** Pharmacie publiable uniquement depuis la page officielle des pharmacies de garde. */
export function isVerifiedPharmacySource(sourceUrl?: string | null): boolean {
  return Boolean(sourceUrl?.toLowerCase().includes(VERIFIED_PHARMACY_SOURCE));
}

function withoutUnverifiedPharmacy(snap: GardeMooreaSnapshot): GardeMooreaSnapshot {
  if (isVerifiedPharmacySource(snap.sourceUrl)) return snap;
  if (!snap.pharmacy && !(snap.pharmacyHours && snap.pharmacyHours.length > 0)) {
    return snap;
  }
  return { ...snap, pharmacy: null, pharmacyHours: [] };
}

function officialTableImage(
  ...urls: Array<string | null | undefined>
): string | null {
  for (const url of urls) {
    if (url?.includes("ordre-pharmaciens-polynesie.com")) return url;
  }
  return null;
}

function preferredGardeSourceUrl(
  ...urls: Array<string | null | undefined>
): string | undefined {
  const usable = urls.filter(
    (url): url is string => Boolean(url) && !isCommuneGardeSourceUrl(url),
  );
  return (
    usable.find((url) => url.includes("ordre-pharmaciens-polynesie.com/medecins-de-garde")) ??
    usable.find((url) => url.includes("ordre-pharmaciens-polynesie.com")) ??
    usable[0]
  );
}

function pharmacyDutyFromSnapshot(
  snap: GardeMooreaSnapshot,
  source: string,
): OnCallDuty | null {
  if (!isVerifiedPharmacySource(snap.sourceUrl)) return null;
  if (snap.pharmacy?.name) {
    return toDuty("pharmacy", snap.pharmacy, source, snap.sourceUrl);
  }
  const hours =
    snap.pharmacyHours && snap.pharmacyHours.length > 0
      ? snap.pharmacyHours
      : null;
  if (!hours?.length) return null;
  const summary = hours
    .map((h) => `${h.district} ${h.phone}`)
    .join(" · ");
  const first = hours[0]!;
  return {
    name: `Pharmacies Moorea (${hours.map((h) => h.district).join(" · ")})`,
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
  if (!isGardeWeekRelevant(now, snap.validFrom, snap.validTo)) {
    return { pharmacy: null, doctor: null, weekendLabel: null };
  }

  const source = snap.sourceUrl?.includes("pharmacies-de-garde")
    ? "Ordre des pharmaciens (COPPF)"
    : snap.sourceUrl?.includes("ordre-pharmaciens")
      ? "Ordre des médecins (COPPF)"
      : "MooreaNews";
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

function parseOwnFacebookPostToSnapshot(
  post: {
    created_time?: string;
    message?: string;
    permalink_url?: string;
    full_picture?: string;
  },
): GardeMooreaSnapshot | null {
  if (isCommuneGardeSourceUrl(post.permalink_url)) return null;
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
    pharmacy: null,
    communePosterUrl: null,
    posterImageUrl: picture && !isCommuneOrFacebookGardeAsset(picture) ? picture : null,
    sourceUrl: post.permalink_url,
    syncedAt: new Date().toISOString(),
  };
}

async function fetchGardeFromFacebookPages(): Promise<GardeMooreaSnapshot | null> {
  const posts = await listMooreaNewsGraphPosts();
  const cutoff = Date.now() - 21 * 86400000;
  const now = new Date();
  const candidates: GardeMooreaSnapshot[] = [];
  const seen = new Set<string>();

  for (const post of posts) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);

    const t = Date.parse(post.created_time ?? "");
    if (t && t < cutoff) continue;

    const snap = parseOwnFacebookPostToSnapshot(post);
    if (snap) candidates.push(withoutUnverifiedPharmacy(snap));
  }

  return pickBestGardeSnapshot(candidates, now);
}

export async function fetchLiveGardeMooreaSnapshot(): Promise<GardeMooreaSnapshot | null> {
  const [coppf, site, fb] = await Promise.all([
    fetchCoppfGardeSnapshot().catch(() => null),
    fetchGardeFromImportedArticles().catch(() => null),
    fetchGardeFromFacebookPages().catch(() => null),
  ]);
  const candidates = [coppf, site, fb].filter(Boolean) as GardeMooreaSnapshot[];
  return pickBestGardeSnapshot(candidates);
}

const getCachedLiveGarde = unstable_cache(
  () => fetchLiveGardeMooreaSnapshot(),
  ["garde-moorea-live"],
  { revalidate: 3600, tags: ["garde-moorea"] },
);

function snapshotFromCacheRow(data: {
  excerpt?: string | null;
  url?: string | null;
  fetched_at?: string | null;
  image_url?: string | null;
} | null): GardeMooreaSnapshot | null {
  if (!data?.excerpt) return null;
  const parsed = parseGardeSnapshotJson(data.excerpt);
  if (!parsed?.validFrom || !parsed.validTo) return null;
  const snap = parsed as GardeMooreaSnapshot;
  snap.sourceUrl = data.url ?? snap.sourceUrl;
  snap.syncedAt = data.fetched_at ?? snap.syncedAt;
  if (!snap.posterImageUrl && data.image_url) {
    snap.posterImageUrl = data.image_url;
  }
  return snap;
}

function newerSnapshot(
  left: GardeMooreaSnapshot | null,
  right: GardeMooreaSnapshot | null,
): GardeMooreaSnapshot | null {
  if (!left) return right;
  if (!right) return left;
  const leftTime = Date.parse(left.syncedAt || "") || 0;
  const rightTime = Date.parse(right.syncedAt || "") || 0;
  return leftTime >= rightTime ? left : right;
}

async function readCacheArticle(
  sourceId: string,
  allowHidden: boolean,
): Promise<{
  excerpt?: string | null;
  url?: string | null;
  fetched_at?: string | null;
  image_url?: string | null;
} | null> {
  const admin = getAdminSupabase();
  const pub = getPublicSupabase();
  const client = allowHidden && admin ? admin : (pub ?? admin);
  if (!client) return null;

  let query = client
    .from("external_articles")
    .select("excerpt, url, fetched_at, image_url")
    .eq("source_id", sourceId)
    .eq("external_id", GARDE_CACHE_EXTERNAL_ID);
  if (!(allowHidden && admin)) query = query.eq("hidden", false);

  const { data } = await query.maybeSingle();
  return data;
}

export async function readGardeMooreaFromCache(): Promise<GardeMooreaSnapshot | null> {
  const [payload, legacy] = await Promise.all([
    readCacheArticle(GARDE_CACHE_PAYLOAD_SOURCE_ID, true),
    readCacheArticle(GARDE_CACHE_SOURCE_ID, false),
  ]);

  return newerSnapshot(snapshotFromCacheRow(payload), snapshotFromCacheRow(legacy));
}

export async function writeGardeMooreaCache(snap: GardeMooreaSnapshot): Promise<boolean> {
  const supabase = getAdminSupabase();
  if (!supabase) return false;

  const title =
    [snap.pharmacy?.name, snap.doctor?.name].filter(Boolean).join(" · ") || "Garde Moorea";
  const json = JSON.stringify(snap).slice(0, 8000);
  const readable = gardeCachePublicExcerpt(snap);
  const shared = {
    url: preferredGardeSourceUrl(snap.sourceUrl) ?? COPPF_MEDECINS_GARDE_URL,
    title: title.slice(0, 500),
    image_url: pickPublicGardePosterUrl(snap.posterImageUrl),
    author: "MooreaNews",
    published_at: `${snap.validFrom}T12:00:00.000Z`,
    fetched_at: snap.syncedAt,
    hidden: false,
  };

  // Ligne technique, hors bloc veille : le JSON reste lisible par la bannière agenda
  // (RLS public = hidden false). La carte publique reçoit une phrase.
  const payload = await supabase.from("external_articles").upsert(
    {
      ...shared,
      source_id: GARDE_CACHE_PAYLOAD_SOURCE_ID,
      source_name: "Garde Moorea (cache)",
      external_id: GARDE_CACHE_EXTERNAL_ID,
      excerpt: json,
    },
    { onConflict: "source_id,external_id" },
  );

  const { error } = await supabase.from("external_articles").upsert(
    {
      ...shared,
      source_id: GARDE_CACHE_SOURCE_ID,
      source_name: "Garde Moorea (auto)",
      external_id: GARDE_CACHE_EXTERNAL_ID,
      excerpt: payload.error ? json : readable,
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
    communePosterUrl: officialTableImage(live?.communePosterUrl, merged.communePosterUrl),
    sourceUrl: preferredGardeSourceUrl(merged.sourceUrl, live?.sourceUrl),
    syncedAt: new Date().toISOString(),
  };
}

async function enrichFromPosterOcr(
  snap: GardeMooreaSnapshot,
  runOcr: boolean,
  force = false,
): Promise<{ snap: GardeMooreaSnapshot; ocrUsed: boolean; ocrError?: string }> {
  const needsOcr =
    runOcr &&
    isGardeOcrEnabled() &&
    (force ||
      !snap.doctor?.name ||
      !isMooreaGardeDoctor(snap.doctor) ||
      !snap.pharmacyHours?.length ||
      (!snap.doctorHours?.saturday && !snap.doctorHours?.sunday));

  if (!needsOcr) return { snap, ocrUsed: false };

  const coppfMeta = await fetchCoppfGardeImageUrl().catch(() => null);
  const coppfImages = await fetchCoppfGardeImageUrls().catch(() => []);
  // Le tableau COPPF (toute la Polynésie) sert de SOURCE, jamais d'image d'article.
  // Les affiches commune / Facebook ne sont pas des entrées OCR.
  if (
    snap.communePosterUrl &&
    (snap.communePosterUrl.includes("ordre-pharmaciens") ||
      isCommuneOrFacebookGardeAsset(snap.communePosterUrl) ||
      isCommuneGardeSourceUrl(snap.communePosterUrl))
  ) {
    snap = { ...snap, communePosterUrl: null };
  }
  if (coppfMeta?.imageUrl) {
    snap = { ...snap, sourceUrl: snap.sourceUrl ?? COPPF_MEDECINS_GARDE_URL };
  }

  const urls: string[] = [];
  const addOfficial = (url: string | null | undefined) => {
    if (!url || urls.includes(url)) return;
    if (!url.includes("ordre-pharmaciens-polynesie.com")) return;
    urls.push(url);
  };
  addOfficial(coppfMeta?.imageUrl);
  for (const img of coppfImages) addOfficial(img.imageUrl);

  if (!urls.length) {
    return { snap, ocrUsed: false, ocrError: "aucune image affiche" };
  }

  let ocrUsed = false;
  let ocrError: string | undefined;
  let working = snap;

  try {
    await withGardeOcrSession(async (session) => {
      for (const url of urls) {
        const ocr = await session.recognizeImageUrl(url);
        if (ocr.ok && ocr.text) {
          working = mergeGardeOcrIntoSnapshot(working, ocr.text);
          ocrUsed = true;
          if (working.officialCheck) break;
        } else if (!ocrError) {
          ocrError = ocr.error ?? `ocr vide (${url.slice(0, 80)})`;
        }
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ocrError = msg.slice(0, 280);
    console.error("[garde-ocr] session failed:", ocrError);
  }

  return { snap: working, ocrUsed, ocrError };
}

export type GardeSyncOptions = {
  /** Vendredi matin : OCR du tableau officiel + affiche MooreaNews. */
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
  validationIssues?: string[];
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

  const fileSnap = await readGardeFileSnapshot();
  if (fileSnap?.validFrom === snap.validFrom) {
    snap = mergeGardeSnapshots(snap, fileSnap);
  }

  // Toujours relire le tableau officiel : ne plus se contenter d'un cache
  // (un mauvais n° restait figé toute la semaine).
  const ocrEnriched = await enrichFromPosterOcr(snap, true, true);
  snap = ocrEnriched.snap;

  const ocrUsed = ocrEnriched.ocrUsed;
  const ocrError = ocrEnriched.ocrError;

  const shouldMakePoster =
    options.fullWeekendPipeline ||
    !snap.posterImageUrl ||
    snap.posterImageUrl.startsWith("/") ||
    Boolean(snap.doctor?.name || snap.pharmacy?.name);

  if (shouldMakePoster && gardePosterHasContent(snap) && validateGardeBeforePublish(snap, now).ok) {
    const mooreaPoster = await renderAndUploadMooreaNewsGardePoster(snap);
    if (mooreaPoster) {
      snap.posterImageUrl = mooreaPoster;
    } else {
      const local = await localGardePosterPath(snap.validFrom);
      snap.posterImageUrl = pickPublicGardePosterUrl(local, snap.posterImageUrl);
    }
  }

  if (fileSnap?.validFrom === snap.validFrom) {
    snap = mergeGardeSnapshots(snap, fileSnap);
  }

  // Ne jamais écraser un médecin/pharmacie déjà en cache si OCR a échoué.
  const prevCache = await readGardeMooreaFromCache().catch(() => null);
  if (prevCache?.validFrom === snap.validFrom) {
    snap = mergeGardeSnapshots(snap, prevCache);
  }

  snap.syncedAt = new Date().toISOString();
  // Pas de liste de pharmacies sans horaires lus sur une source vérifiée.
  snap.pharmacyHours = (snap.pharmacyHours ?? []).filter((p) => p.saturday || p.sunday);
  if (snap.pharmacy?.name?.startsWith("Pharmacies Moorea")) snap.pharmacy = null;
  snap = withoutUnverifiedPharmacy(snap);

  // Garde-fou : on ne publie RIEN d'incohérent (médecin hors Moorea, n° décalé,
  // horaires absents, mauvaise semaine). On signale à la place.
  const validation = validateGardeBeforePublish(snap, now);
  if (!validation.ok) {
    console.error("[garde] publication refusée :", validation.issues.join(" ; "));
    return {
      ok: false,
      found: true,
      pharmacy: null,
      doctor: snap.doctor?.name ?? null,
      weekend: snap.label,
      articleSlug: null,
      ocrUsed,
      posterGenerated: false,
      ocrError: `validation: ${validation.issues.join(" ; ")}`.slice(0, 400),
      validationIssues: validation.issues,
    };
  }

  if (!isVerifiedPharmacySource(snap.sourceUrl)) {
    snap = { ...snap, sourceUrl: COPPF_MEDECINS_GARDE_URL };
  }
  snap = {
    ...snap,
    posterImageUrl: pickPublicGardePosterUrl(snap.posterImageUrl),
  };

  const article = await upsertGardeWeekendArticle(snap);
  snap.articleSlug = article.slug;
  const articleCreated = article.created;
  const articleUpdated = article.updated;
  const articleError = article.error;

  await writeGardeMooreaCache(snap);

  const duties = snapshotToPublicDuties(snap, now);

  return {
    ok: true,
    found: true,
    pharmacy: duties.pharmacy?.name ?? snap.pharmacy?.name ?? null,
    doctor: duties.doctor?.name ?? snap.doctor?.name ?? null,
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
