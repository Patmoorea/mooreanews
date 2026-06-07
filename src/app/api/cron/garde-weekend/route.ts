import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getTahitiClock, shouldPublishGardeWeekend } from "@/lib/cron-tahiti";
import { syncHealthOnCall } from "@/lib/health-on-call";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Pipeline garde week-end : OCR affiche commune + affiche MooreaNews + article. */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const clock = getTahitiClock();

  if (!force && !shouldPublishGardeWeekend(clock)) {
    return NextResponse.json({
      skipped: true,
      reason: "hors créneau vendredi matin Tahiti",
      tahiti: clock.label,
    });
  }

  try {
    const result = await syncHealthOnCall({ fullWeekendPipeline: true });

    revalidatePath("/sante-garde");
    revalidatePath("/actualites");
    revalidatePath("/", "layout");

    return NextResponse.json({
      tahiti: clock.label,
      forced: force,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[garde-weekend cron]", message);
    return NextResponse.json(
      { ok: false, error: message.slice(0, 500), tahiti: clock.label, forced: force },
      { status: 500 },
    );
  }
}

export const POST = GET;
