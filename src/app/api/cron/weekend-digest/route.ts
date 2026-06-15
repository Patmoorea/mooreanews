import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getTahitiClock, shouldSendWeekendDigest, digestEmailsEnabled } from "@/lib/cron-tahiti";
import { sendWeekendDigest } from "@/lib/weekend-digest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const clock = getTahitiClock();

  if (!digestEmailsEnabled()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Digests email désactivés — seule la newsletter du dimanche 18h est envoyée",
    });
  }

  if (!force && !shouldSendWeekendDigest(clock)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "hors créneau vendredi 7h Tahiti (ajoutez force=1 pour test)",
      tahiti: clock.label,
    });
  }

  const result = await sendWeekendDigest();
  return NextResponse.json({ ok: true, tahiti: clock.label, forced: force, ...result });
}
