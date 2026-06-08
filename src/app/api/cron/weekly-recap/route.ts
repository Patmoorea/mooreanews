import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getTahitiClock, shouldPublishWeeklyRecap } from "@/lib/cron-tahiti";
import { syncWeeklyRecapFromMooreaNews } from "@/lib/weekly-recap-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Pipeline récap semaine : affiche MooreaNews + article agenda & actu. */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const clock = getTahitiClock();

  if (!force && !shouldPublishWeeklyRecap(clock)) {
    return NextResponse.json({
      skipped: true,
      reason: "hors créneau lundi matin Tahiti",
      tahiti: clock.label,
    });
  }

  try {
    const result = await syncWeeklyRecapFromMooreaNews();

    revalidatePath("/actualites");
    revalidatePath("/", "layout");

    return NextResponse.json({
      tahiti: clock.label,
      forced: force,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[weekly-recap cron]", message);
    return NextResponse.json(
      { ok: false, error: message.slice(0, 500), tahiti: clock.label, forced: force },
      { status: 500 },
    );
  }
}

export const POST = GET;
