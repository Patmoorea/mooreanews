import { NextResponse } from "next/server";
import { importMissingInfoPratiquesFromJson } from "@/lib/supabase/sync-info-pratiques";

/**
 * Importe les fiches du catalogue JSON manquantes en Supabase.
 * Appel : GET /api/admin/sync-info-catalog?secret=VOTRE_CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get("secret")?.trim();

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await importMissingInfoPratiquesFromJson();
  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    imported: result.imported,
    skipped: result.skipped,
  });
}
