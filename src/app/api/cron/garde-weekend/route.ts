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

  const result = await syncHealthOnCall({ fullWeekendPipeline: true });

  revalidatePath("/sante-garde");
  revalidatePath("/actualites");
  revalidatePath("/", "layout");

  return NextResponse.json({
    tahiti: clock.label,
    forced: force,
    ...result,
  });
}

export const POST = GET;
