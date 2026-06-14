/**
 * Copie l’affiche Facebook (fbcdn…) vers Supabase Storage pour affichage stable.
 */

import { uploadBufferToMedia } from "@/lib/media-upload";
import { getAdminSupabase } from "@/lib/supabase/admin";

export type CoverPersistResult = {
  url: string | null;
  persisted: boolean;
  reason: string;
};

function safePostPath(postId: string): string {
  return postId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 96);
}

export function isFacebookCdnCoverUrl(url: string | null | undefined): boolean {
  const u = url?.trim().toLowerCase() ?? "";
  return u.includes("fbcdn.net") || u.includes("fbsbx.com");
}

/** URL à enregistrer en base — jamais fbcdn (invisible sur le site). */
export function coverUrlForDatabase(
  result: CoverPersistResult,
): string | null {
  const u = result.url?.trim();
  if (!u?.startsWith("http")) return null;
  if (isFacebookCdnCoverUrl(u)) return null;
  return u.length > 2048 ? u.slice(0, 2048) : u;
}

export function postIdFromMooreaNewsSlug(slug: string): string {
  const m = slug.match(/mooreanews-fb-(\d+)-(\d+)$/);
  if (m) return `${m[1]}_${m[2]}`;
  return slug.replace(/^mooreanews-fb-/, "").replace(/-/g, "_");
}

async function remoteCoverFromOpenGraph(slug: string): Promise<string | null> {
  const m = slug.match(/mooreanews-fb-(\d+)-(\d+)$/);
  if (!m) return null;
  const [, pageId, postId] = m;
  return remoteCoverFromFacebookPost(pageId, postId);
}

export async function remoteCoverFromFacebookPost(
  pageId: string,
  postId: string,
  permalink?: string | null,
): Promise<string | null> {
  const { fetchOpenGraph } = await import("@/lib/open-graph");
  const { openGraphUrlsForFacebookPost } = await import(
    "@/lib/facebook-post-enrich"
  );
  const candidates = openGraphUrlsForFacebookPost(
    { id: `${pageId}_${postId}`, permalink_url: permalink ?? undefined },
    pageId,
  );

  for (const url of candidates) {
    try {
      const og = await fetchOpenGraph(url);
      const img = og?.imageUrl?.trim();
      if (img?.startsWith("http")) return img;
    } catch {
      /* essai suivant */
    }
  }
  return null;
}

/** Tente toutes les sources (Graph, OG) puis copie vers Supabase Storage. */
export async function persistFacebookCoverForPost(
  post: {
    id: string;
    full_picture?: string | null;
    permalink_url?: string | null;
  },
  slug: string,
  pageId = "350029589936",
): Promise<CoverPersistResult> {
  const candidates: string[] = [];
  const pic = post.full_picture?.trim();
  if (pic?.startsWith("http")) candidates.push(pic);

  const m = slug.match(/mooreanews-fb-(\d+)-(\d+)$/);
  const ogPageId = m?.[1] ?? pageId;
  const ogPostId = m?.[2] ?? post.id.split("_").pop() ?? "";
  const ogCover = await remoteCoverFromFacebookPost(
    ogPageId,
    ogPostId,
    post.permalink_url,
  );
  if (ogCover) candidates.push(ogCover);

  let last: CoverPersistResult = {
    url: null,
    persisted: false,
    reason: "missing_url",
  };
  for (const url of [...new Set(candidates)]) {
    last = await persistFacebookCoverUrl(url, post.id);
    if (coverUrlForDatabase(last)) return last;
  }
  return last;
}

/** Télécharge l’image distante et renvoie l’URL publique Supabase. */
export async function persistFacebookCoverUrl(
  remoteUrl: string | undefined | null,
  postId: string,
): Promise<CoverPersistResult> {
  const u = remoteUrl?.trim();
  if (!u?.startsWith("http")) {
    return { url: null, persisted: false, reason: "missing_url" };
  }
  if (u.includes("supabase.co/storage/v1/object/public/")) {
    return { url: u, persisted: true, reason: "already_supabase" };
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return { url: null, persisted: false, reason: "supabase_absent" };
  }

  try {
    const res = await fetch(u, {
      headers: {
        "User-Agent":
          "facebookexternalhit/1.1 (+https://www.mooreanews.com)",
        Accept: "image/*,*/*",
        Referer: "https://www.facebook.com/",
      },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return {
        url: null,
        persisted: false,
        reason: `fetch_http_${res.status}`,
      };
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (contentType.includes("text/html")) {
      return { url: null, persisted: false, reason: "fetch_html_not_image" };
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 200) {
      return { url: null, persisted: false, reason: "body_too_small" };
    }

    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";

    const path = `facebook-import/${safePostPath(postId)}.${ext}`;
    const uploaded = await uploadBufferToMedia(admin, buffer, path, mime);
    if (!uploaded.ok) {
      return {
        url: null,
        persisted: false,
        reason: `upload_${uploaded.error}${uploaded.detail ? `:${uploaded.detail}` : ""}`,
      };
    }
    return { url: uploaded.url, persisted: true, reason: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const reason = /abort|timeout/i.test(msg) ? "fetch_timeout" : "fetch_failed";
    return { url: null, persisted: false, reason };
  }
}

export function coverPersistUserMessage(
  slug: string,
  reason: string,
): string {
  const labels: Record<string, string> = {
    missing_url: "aucune URL d’affiche",
    supabase_absent: "Supabase non configuré",
    fetch_http_403: "Facebook refuse le téléchargement (403)",
    fetch_http_404: "image introuvable (404)",
    fetch_html_not_image: "Facebook renvoie du HTML au lieu de l’image",
    body_too_small: "fichier image trop petit ou vide",
    fetch_timeout: "timeout téléchargement (>15 s)",
    fetch_failed: "échec réseau téléchargement",
    upload_upload_failed: "échec upload Supabase Storage",
    upload_bucket_missing: "bucket media Supabase absent",
  };
  const detail = labels[reason] ?? reason;
  return `Affiche non copiée vers Supabase — ${slug} : ${detail}`;
}

/** Rattrape les cover_url fbcdn ou absents encore en base (hors top 20 Graph). */
export async function repairPendingFbcdnCoversFromDb(limit = 8): Promise<{
  repaired: number;
  failed: number;
  errors: string[];
  warnings: string[];
}> {
  const out = { repaired: 0, failed: 0, errors: [] as string[], warnings: [] as string[] };
  const supabase = getAdminSupabase();
  if (!supabase) {
    out.errors.push("Supabase absent");
    return out;
  }

  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, cover_url")
    .like("slug", "mooreanews-fb-%")
    .or(
      "cover_url.is.null,cover_url.eq.,cover_url.ilike.%fbcdn.net%,cover_url.ilike.%fbsbx.com%",
    )
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    out.errors.push(error.message);
    return out;
  }

  for (const row of data ?? []) {
    const slug = row.slug ?? "";
    if (!slug) continue;

    let cover = row.cover_url?.trim() ?? "";
    if (!cover || isFacebookCdnCoverUrl(cover)) {
      if (!cover) {
        const m = slug.match(/mooreanews-fb-(\d+)-(\d+)$/);
        if (m) {
          const ogCover = await remoteCoverFromFacebookPost(m[1], m[2]);
          if (ogCover) cover = ogCover;
        }
      }
      if (!cover) continue;
    }

    const postId = postIdFromMooreaNewsSlug(slug);
    const persisted = await persistFacebookCoverUrl(cover, postId);
    const nextCover = coverUrlForDatabase(persisted);

    if (!nextCover) {
      out.failed += 1;
      out.warnings.push(coverPersistUserMessage(slug, persisted.reason));
      if (isFacebookCdnCoverUrl(row.cover_url)) {
        await supabase
          .from("articles")
          .update({
            cover_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
      }
      continue;
    }

    const { error: updErr } = await supabase
      .from("articles")
      .update({
        cover_url: nextCover,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updErr) {
      out.failed += 1;
      out.errors.push(`${slug}: ${updErr.message}`);
    } else {
      out.repaired += 1;
    }
  }

  return out;
}

/** Compte les articles MooreaNews dont l’affiche est encore sur fbcdn. */
export async function countFbcdnCoversInDb(): Promise<number> {
  const supabase = getAdminSupabase();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .like("slug", "mooreanews-fb-%")
    .or("cover_url.ilike.%fbcdn.net%,cover_url.ilike.%fbsbx.com%");

  if (error) return 0;
  return count ?? 0;
}
