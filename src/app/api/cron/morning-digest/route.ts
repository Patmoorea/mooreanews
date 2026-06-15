import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getTahitiClock, shouldSendMorningDigest, digestEmailsEnabled } from "@/lib/cron-tahiti";
import { sendMorningDigest } from "@/lib/morning-digest";

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

  if (!force && !shouldSendMorningDigest(clock)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "hors créneau 7h Tahiti (ajoutez force=1 pour test manuel)",
      tahiti: clock.label,
    });
  }

  const result = await sendMorningDigest();
  return NextResponse.json({ ok: true, tahiti: clock.label, forced: force, ...result });
}
