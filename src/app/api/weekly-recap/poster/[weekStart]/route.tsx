import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { buildWeeklyRecapSnapshotForWeekStart } from "@/lib/weekly-recap-data";
import {
  WeeklyRecapPosterElement,
  WEEKLY_RECAP_POSTER_SIZE,
} from "@/lib/weekly-recap-poster";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ weekStart: string }> },
) {
  const { weekStart } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  try {
    const snap = await buildWeeklyRecapSnapshotForWeekStart(weekStart);
    return new ImageResponse(
      WeeklyRecapPosterElement({ snap }),
      WEEKLY_RECAP_POSTER_SIZE,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[weekly-recap-poster]", message);
    return NextResponse.json({ error: message.slice(0, 280) }, { status: 500 });
  }
}
