import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { requireStaffSession } from "@/lib/admin-auth";
import { uploadImageToMedia } from "@/lib/media-upload";

export const runtime = "nodejs";

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

  const result = await uploadImageToMedia(admin, file, "uploads");
  if (!result.ok) {
    const status =
      result.error === "file_too_large"
        ? 413
        : result.error === "invalid_type"
          ? 400
          : result.error === "bucket_missing"
            ? 503
            : 500;
    return NextResponse.json(
      { ok: false, error: result.error, detail: result.detail },
      { status },
    );
  }

  return NextResponse.json({ ok: true, url: result.url, path: result.path });
}
