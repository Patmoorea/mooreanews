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
  | "upload_failed"
  | "bucket_missing";

const MEDIA_BUCKET = "media";

function isBucketMissingMessage(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("bucket not found") || m.includes("bucket does not exist");
}

/** Crée le bucket public `media` si absent (service role requis). */
async function ensureMediaBucket(
  admin: SupabaseClient,
): Promise<{ ok: true } | { ok: false; detail: string }> {
  const { data: existing } = await admin.storage.getBucket(MEDIA_BUCKET);
  if (existing) return { ok: true };

  const { error } = await admin.storage.createBucket(MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already exists") ||
      error.message.toLowerCase().includes("duplicate")
    ) {
      return { ok: true };
    }
    return { ok: false, detail: error.message };
  }

  return { ok: true };
}

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

  async function tryUpload() {
    return admin.storage.from(MEDIA_BUCKET).upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  }

  let { error: uploadError } = await tryUpload();

  if (uploadError && isBucketMissingMessage(uploadError.message)) {
    const ensured = await ensureMediaBucket(admin);
    if (!ensured.ok) {
      return {
        ok: false,
        error: "bucket_missing",
        detail: ensured.detail,
      };
    }
    ({ error: uploadError } = await tryUpload());
  }

  if (uploadError) {
    if (isBucketMissingMessage(uploadError.message)) {
      return {
        ok: false,
        error: "bucket_missing",
        detail:
          "Le stockage Supabase n’est pas prêt : exécutez supabase/storage-media.sql dans le SQL Editor, ou vérifiez SUPABASE_SERVICE_ROLE_KEY sur Vercel.",
      };
    }
    return {
      ok: false,
      error: "upload_failed",
      detail: uploadError.message,
    };
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  return { ok: true, url: publicUrl, path };
}
