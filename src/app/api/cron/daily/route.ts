import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { runDailyCron } from "@/lib/cron-daily";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron UNIQUE Vercel Hobby (1×/jour).
 * 16:05 UTC ≈ 6:05 heure de Tahiti.
 * Enchaîne : météo, veille RSS, digests (si créneau), ferry, Telegram…
 */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runDailyCron();
  return NextResponse.json(result);
}

export const POST = GET;
