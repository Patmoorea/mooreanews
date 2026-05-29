import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendWeekendDigest } from "@/lib/weekend-digest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await sendWeekendDigest();
  return NextResponse.json({ ok: true, ...result });
}
