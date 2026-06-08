/**
 * Copie l’affiche Facebook (fbcdn…) vers Supabase Storage pour affichage stable.
 */

import { uploadBufferToMedia } from "@/lib/media-upload";
import { getAdminSupabase } from "@/lib/supabase/admin";

function safePostPath(postId: string): string {
  return postId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 96);
}

/** Télécharge l’image distante et renvoie l’URL publique Supabase (ou l’URL d’origine). */
export async function persistFacebookCoverUrl(
  remoteUrl: string | undefined | null,
  postId: string,
): Promise<string | null> {
  const u = remoteUrl?.trim();
  if (!u?.startsWith("http")) return null;
  if (u.includes("supabase.co/storage/v1/object/public/")) return u;

  const admin = getAdminSupabase();
  if (!admin) return u;

  try {
    const res = await fetch(u, {
      headers: {
        "User-Agent":
          "facebookexternalhit/1.1 (+https://www.mooreanews.com)",
        Accept: "image/*,*/*",
      },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return u;

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 200) return u;

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
    return uploaded.ok ? uploaded.url : u;
  } catch {
    return u;
  }
}
