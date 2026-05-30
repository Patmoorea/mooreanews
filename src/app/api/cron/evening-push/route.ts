import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendEveningDigestPush } from "@/lib/push-notify";

export const dynamic = "force-dynamic";

/** Cron externe (cron-job.org) — jeu–dim ~17h Tahiti : `0 3 * * 4-0` UTC ≈ 17h Tahiti */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await sendEveningDigestPush();
  return NextResponse.json({ ok: true, ...result });
}
