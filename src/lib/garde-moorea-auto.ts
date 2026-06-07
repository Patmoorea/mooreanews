/**
 * Veille automatique garde Moorea — Facebook commune (+ cache Supabase).
 */

import { unstable_cache } from "next/cache";
import { listCommuneMooreaGraphPosts } from "@/lib/facebook-watch";
import {
  inferWeekendFromPostDate,
  parseGardePost,
  type ParsedGardeWeekend,
} from "@/lib/garde-announcement-parse";
import { isGardeWeekActive } from "@/lib/garde-moorea-data";
import { MOOREA_PHARMACIES } from "@/lib/moorea-pharmacies";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { OnCallDuty } from "@/lib/health-on-call-shared";

export const GARDE_CACHE_SOURCE_ID = "moorea-garde-weekend";
const GARDE_CACHE_EXTERNAL_ID = "current";
const COMMUNE_FB = "https://www.facebook.com/CommuneMooreaMaiao";

export type GardeMooreaSnapshot = ParsedGardeWeekend & {
  sourceUrl?: string;
  syncedAt: string;
};

function toDuty(
  kind: "pharmacy" | "doctor",
  entry: { name: string; phone: string; phoneHref: string } | null,
  source: string,
  sourceUrl?: string,
): OnCallDuty | null {
  if (!entry?.name) return null;
  if (kind === "doctor") {
    return {
      name: entry.name.startsWith("Dr") ? entry.name : `Dr ${entry.name}`,
      phone: entry.phone,
      phoneHref: entry.phoneHref,
      source,
      sourceUrl,
    };
  }
  const ph = MOOREA_PHARMACIES.find((p) => p.name === entry.name);
  return {
    name: entry.name,
    phone: entry.phone,
    phoneHref: entry.phoneHref,
    address: ph?.address,
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
    doctor: toDuty("doctor", snap.doctor, source, snap.sourceUrl),
  };
}

async function fetchGardeFromCommuneFacebook(): Promise<GardeMooreaSnapshot | null> {
  const posts = await listCommuneMooreaGraphPosts();
  const cutoff = Date.now() - 21 * 86400000;

  for (const post of posts) {
    const t = Date.parse(post.created_time ?? "");
    if (t && t < cutoff) continue;

    const msg = post.message ?? "";
    let parsed = parseGardePost(msg, post.created_time);
    if (!parsed) {
      const partial = parseGardePost(msg);
      const inferred = partial && post.created_time
        ? inferWeekendFromPostDate(post.created_time)
        : null;
      if (partial && inferred) {
        parsed = { ...inferred, ...partial };
      }
    }

    if (!parsed || (!parsed.doctor && !parsed.pharmacy)) continue;

    return {
      ...parsed,
      sourceUrl: post.permalink_url ?? COMMUNE_FB,
      syncedAt: new Date().toISOString(),
    };
  }

  return null;
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
  return fb ?? rss;
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
    .select("excerpt, url, fetched_at")
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
      excerpt: JSON.stringify(snap).slice(0, 5000),
      image_url: null,
      author: "Commune Moorea-Maiao",
      published_at: `${snap.validFrom}T12:00:00.000Z`,
      fetched_at: snap.syncedAt,
      hidden: false,
    },
    { onConflict: "source_id,external_id" },
  );

  return !error;
}

export async function syncGardeMooreaFromCommune(): Promise<{
  ok: boolean;
  found: boolean;
  pharmacy: string | null;
  doctor: string | null;
  weekend: string | null;
}> {
  const snap = await fetchLiveGardeMooreaSnapshot();
  if (!snap) {
    return { ok: true, found: false, pharmacy: null, doctor: null, weekend: null };
  }

  await writeGardeMooreaCache(snap);

  return {
    ok: true,
    found: true,
    pharmacy: snap.pharmacy?.name ?? null,
    doctor: snap.doctor?.name ?? null,
    weekend: snap.label,
  };
}

export async function resolveGardeMooreaAuto(now = new Date()): Promise<{
  pharmacy: OnCallDuty | null;
  doctor: OnCallDuty | null;
  weekendLabel: string | null;
}> {
  let snap: GardeMooreaSnapshot | null = null;

  try {
    snap = await getCachedLiveGarde();
  } catch {
    snap = await fetchLiveGardeMooreaSnapshot();
  }

  if (!snap) {
    snap = await readGardeMooreaFromCache();
  }

  if (!snap) {
    return { pharmacy: null, doctor: null, weekendLabel: null };
  }

  return snapshotToDuties(snap, now);
}
