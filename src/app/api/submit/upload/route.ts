import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { uploadImageToMedia } from "@/lib/media-upload";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Téléversement d’affiche pour /soumettre (sans compte admin). */
export async function POST(req: Request) {
  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "storage_not_configured" },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_form" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "missing_file" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const result = await uploadImageToMedia(admin, file, "submissions");
  if (!result.ok) {
    const status =
      result.error === "file_too_large"
        ? 413
        : result.error === "invalid_type"
          ? 400
          : 500;
    return NextResponse.json(
      { ok: false, error: result.error, detail: result.detail },
      { status, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    { ok: true, url: result.url, path: result.path },
    { headers: CORS_HEADERS },
  );
}
