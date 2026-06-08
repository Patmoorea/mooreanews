import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getFacebookImportStatus } from "@/lib/facebook-import-status";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** GET /api/watch/facebook-import-status?secret=... */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = await getFacebookImportStatus();
  return NextResponse.json(status);
}
