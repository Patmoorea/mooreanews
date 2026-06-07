import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { runVeilleCron } from "@/lib/cron-veille";

/**
 * Veille horaire (RSS + Facebook) — léger, sans OCR ni digests.
 * GitHub Actions + npm run veille.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runVeilleCron();
    return NextResponse.json({ ...result, legacyRoute: "/api/cron/aggregate" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/aggregate]", message);
    return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 });
  }
}

export const POST = GET;
