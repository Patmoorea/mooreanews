/**
 * Copie une image distante (og:image d’un média) dans Supabase Storage.
 * Évite les couvertures cassées sur le site : domaines absents de
 * next.config `images.remotePatterns`, hotlink bloqué, URL expirée…
 * (Telegram, lui, affiche l’URL d’origine directement.)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadBufferToMedia } from "@/lib/media-upload";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function isOwnStorageUrl(url: string): boolean {
  return /\.supabase\.co\/storage\/v1\/object\/public\//i.test(url);
}

/** Retourne l’URL Supabase de la copie, ou null si l’image est illisible. */
export async function persistRemoteCover(
  admin: SupabaseClient,
  url: string | null | undefined,
  key: string,
): Promise<string | null> {
  const src = url?.trim();
  if (!src || !/^https?:\/\//i.test(src)) return null;
  if (isOwnStorageUrl(src)) return src;
  try {
    const res = await fetch(src, {
      headers: { "User-Agent": UA, Accept: "image/webp,image/png,image/jpeg,image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const contentType =
      type === "image/png" || type === "image/webp" || type === "image/jpeg"
        ? type
        : type === "image/jpg"
          ? "image/jpeg"
          : null;
    if (!contentType) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 2_000) return null;
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const safeKey = key.replace(/[^a-z0-9-]+/gi, "-").slice(0, 90);
    const up = await uploadBufferToMedia(
      admin,
      buffer,
      `generated/ai-covers/${safeKey}.${ext}`,
      contentType,
    );
    return up.ok ? up.url : null;
  } catch {
    return null;
  }
}
