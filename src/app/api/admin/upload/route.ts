import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { requireStaffSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  const auth = await requireStaffSession();
  if ("error" in auth) {
    const status =
      auth.error === "unauthorized"
        ? 401
        : auth.error === "forbidden"
          ? 403
          : 503;
    return NextResponse.json({ ok: false, error: auth.error }, { status });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "storage_not_configured" },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_form" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "missing_file" },
      { status: 400 },
    );
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_type",
        detail: "JPEG, PNG, WebP ou GIF uniquement",
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: "file_too_large",
        detail: "Taille maximum : 5 Mo",
      },
      { status: 413 },
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const path = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("media")
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      {
        ok: false,
        error: "upload_failed",
        detail: uploadError.message,
      },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("media").getPublicUrl(path);

  return NextResponse.json({ ok: true, url: publicUrl, path });
}
