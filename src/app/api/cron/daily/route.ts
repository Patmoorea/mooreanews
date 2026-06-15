import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { runDailyCron } from "@/lib/cron-daily";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Job quotidien complet MooreaNews.
 * Déclenché par GitHub Actions `cron-daily.yml` (~6h05 Tahiti), pas par Vercel cron.
 */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyCron();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/daily]", message);
    return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 });
  }
}

export const POST = GET;
