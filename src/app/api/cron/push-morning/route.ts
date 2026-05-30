import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendMorningDigestPush } from "@/lib/push-notify";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await sendMorningDigestPush();
  return NextResponse.json({ ok: true, ...result });
}
