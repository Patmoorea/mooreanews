/**
 * Veille automatique garde Moorea.
 * Médecin : tableau officiel de l'Ordre uniquement.
 * Pharmacie de garde : commune (Facebook, RSS, affiche) ou autre source citée,
 * seulement si le texte couvre le samedi et le dimanche en cours.
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
  fetchCoppfGardeImageUrls,
  fetchCoppfGardeSnapshot,
} from "@/lib/garde-ordre-pharmaciens";
import { isGardeOcrEnabled, withGardeOcrSession } from "@/lib/garde-poster-ocr";
import { expectedWeekend, validateOfficialMooreaGarde, type GardeValidation } from "@/lib/garde-official-table";
import {
  resolveOnDutyPharmacy,
  type PharmacyDuty,
} from "@/lib/garde-pharmacy-duty";

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
  /** Pharmacie de garde citée pour ce samedi et ce dimanche. Jamais le médecin. */
  pharmacyDuty?: PharmacyDuty | null;
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

function applyPharmacyDuty(
  snap: GardeMooreaSnapshot,
  duty: PharmacyDuty | null,
): GardeMooreaSnapshot {
  if (!duty || duty.validFrom !== snap.validFrom || duty.validTo !== snap.validTo) {
    return { ...snap, pharmacy: null, pharmacyDuty: null };
  }
  return {
    ...snap,
    pharmacy: { name: duty.name, phone: duty.phone, phoneHref: duty.phoneHref },
    pharmacyDuty: duty,
  };
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

function pharmacyDutyForNow(snap: GardeMooreaSnapshot, now: Date): OnCallDuty | null {
  const duty = snap.pharmacyDuty;
  if (!duty?.name) return null;
  const want = expectedWeekend(now);
  if (duty.validFrom !== want.validFrom || duty.validTo !== want.validTo) return null;
  if (duty.validFrom !== snap.validFrom || duty.validTo !== snap.validTo) return null;
  return toDuty("pharmacy", duty, duty.sourceLabel, duty.sourceUrl);
}

/** Médecin / pharmacie affichés sur le site à partir du snapshot garde. */
export function snapshotToPublicDuties(
  snap: GardeMooreaSnapshot,
  now: Date,
): { pharmacy: OnCallDuty | null; doctor: OnCallDuty | null; weekendLabel: string | null } {
  if (!isGardeWeekRelevant(now, snap.validFrom, snap.validTo)) {
    return { pharmacy: null, doctor: null, weekendLabel: null };
  }

  return {
    weekendLabel: snap.label,
    pharmacy: pharmacyDutyForNow(snap, now),
    doctor: toDuty(
      "doctor",
      snap.doctor,
      "Ordre des médecins",
      COPPF_MEDECINS_GARDE_URL,
      snap.doctorAddress,
    ),
  };
}

function parseOwnFacebookPostToSnapshot(
  post: {
    created_time?: string;
    message?: string;
    permalink_url?: string;
    full_picture?: string;
  },
  allowCommune = false,
): GardeMooreaSnapshot | null {
  if (!allowCommune && isCommuneGardeSourceUrl(post.permalink_url)) return null;
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
    if (snap) candidates.push(snap);
  }

  return pickBestGardeSnapshot(candidates, now);
}

type CommuneGardePost = { message: string; picture: string | null; createdTime?: string };

/** Publications récentes de la page Commune de Moorea (secours si COPPF absent). */
async function listRecentCommuneGardePosts(): Promise<CommuneGardePost[]> {
  const posts = await listCommuneMooreaGraphPosts().catch(() => []);
  const cutoff = Date.now() - 10 * 86400000;
  const out: CommuneGardePost[] = [];
  for (const post of posts) {
    const t = Date.parse(post.created_time ?? "");
    if (t && t < cutoff) continue;
    const msg = post.message ?? "";
    if (!/garde|m[ée]decin|pharmacie/i.test(msg)) continue;
    out.push({ message: msg, picture: post.full_picture?.trim() || null, createdTime: post.created_time });
  }
  return out;
}

/** Secours Commune : uniquement le week-end courant, dates plausibles. */
async function fetchGardeFromCommunePage(now = new Date()): Promise<GardeMooreaSnapshot | null> {
  const posts = await listCommuneMooreaGraphPosts();
  const cutoff = Date.now() - 10 * 86400000;
  const candidates: GardeMooreaSnapshot[] = [];
  for (const post of posts) {
    const t = Date.parse(post.created_time ?? "");
    if (t && t < cutoff) continue;
    const snap = parseOwnFacebookPostToSnapshot(post, true);
    if (!snap) continue;
    if (!isPlausibleGardeDates(snap.validFrom, snap.validTo, now)) continue;
    if (!isGardeWeekRelevant(now, snap.validFrom, snap.validTo)) continue;
    candidates.push({ ...snap, posterImageUrl: null });
  }
  return pickBestGardeSnapshot(candidates, now);
}

export async function fetchLiveGardeMooreaSnapshot(): Promise<GardeMooreaSnapshot | null> {
  const now = new Date();
  const [coppf, site, fb] = await Promise.all([
    fetchCoppfGardeSnapshot().catch(() => null),
    fetchGardeFromImportedArticles().catch(() => null),
    fetchGardeFromFacebookPages().catch(() => null),
  ]);
  const candidates = [coppf, site, fb].filter(Boolean) as GardeMooreaSnapshot[];
  const hasCurrent = candidates.some(
    (c) => Boolean(c.doctor?.name) && isGardeWeekRelevant(now, c.validFrom, c.validTo),
  );
  if (!hasCurrent) {
    const commune = await fetchGardeFromCommunePage(now).catch(() => null);
    if (commune) candidates.push(commune);
  }
  return pickBestGardeSnapshot(candidates, now);
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

  const now = new Date();
  const want = expectedWeekend(now);
  const communePosts = await listRecentCommuneGardePosts();

  if (!urls.length && !communePosts.length) {
    return { snap, ocrUsed: false, ocrError: "aucune image affiche" };
  }

  let ocrUsed = false;
  let ocrError: string | undefined;
  let working = snap;
  const isGoodForWeekend = (s: GardeMooreaSnapshot) =>
    Boolean(s.doctor?.name) &&
    isMooreaGardeDoctor(s.doctor) &&
    s.validFrom === want.validFrom &&
    isPlausibleGardeDates(s.validFrom, s.validTo, now);

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

      // Secours : affiche de la Commune de Moorea (COPPF sans tableau du week-end).
      if (!isGoodForWeekend(working)) {
        for (const post of communePosts) {
          let text = post.message;
          if (post.picture) {
            const ocr = await session.recognizeImageUrl(post.picture);
            if (ocr.ok && ocr.text) text = `${text}\n${ocr.text}`;
            else if (!ocrError) ocrError = ocr.error ?? "ocr commune vide";
          }
          const base: GardeMooreaSnapshot = { ...snap, validFrom: want.validFrom, validTo: want.validTo };
          let cand = mergeGardeOcrIntoSnapshot(base, text);
          if (!cand.doctor?.name) {
            const parsed = parseGardeFromSiteContent(text, post.createdTime, Boolean(post.picture));
            if (parsed?.doctor) cand = mergeGardeSnapshots({ ...base, ...parsed, pharmacy: null }, cand);
          }
          if (isGoodForWeekend(cand)) {
            working = { ...cand, communePosterUrl: null };
            ocrUsed = true;
            ocrError = undefined;
            break;
          }
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

  const onDutyPharmacy = await resolveOnDutyPharmacy(now).catch(() => null);
  snap = applyPharmacyDuty(snap, onDutyPharmacy);

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
  snap.pharmacyHours = (snap.pharmacyHours ?? []).filter((p) => p.saturday || p.sunday);
  if (snap.pharmacy?.name?.startsWith("Pharmacies Moorea")) snap.pharmacy = null;
  snap = applyPharmacyDuty(snap, onDutyPharmacy);

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

  snap = {
    ...snap,
    sourceUrl: snap.sourceUrl?.includes("medecins-de-garde")
      ? snap.sourceUrl
      : COPPF_MEDECINS_GARDE_URL,
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
