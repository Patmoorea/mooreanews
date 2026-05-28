import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type ImageUploadError =
  | "missing_file"
  | "invalid_type"
  | "file_too_large"
  | "upload_failed";

export async function uploadImageToMedia(
  admin: SupabaseClient,
  file: File,
  folder: "uploads" | "submissions",
): Promise<
  | { ok: true; url: string; path: string }
  | { ok: false; error: ImageUploadError; detail?: string }
> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "invalid_type",
      detail: "JPEG, PNG, WebP ou GIF uniquement",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "file_too_large",
      detail: "Taille maximum : 5 Mo",
    };
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("media")
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    return {
      ok: false,
      error: "upload_failed",
      detail: uploadError.message,
    };
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("media").getPublicUrl(path);

  return { ok: true, url: publicUrl, path };
}
