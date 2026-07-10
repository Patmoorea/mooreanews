import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { runSiteHealthWatch } from "@/lib/site-health-watch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Surveillance site → Telegram si page publique en panne.
 * GET /api/cron/site-health?secret=CRON_SECRET
 */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runSiteHealthWatch();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
