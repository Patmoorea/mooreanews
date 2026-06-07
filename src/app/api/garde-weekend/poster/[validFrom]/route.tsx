import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { resolveGardeSnapshotForPoster } from "@/lib/garde-moorea-data";
import {
  GardeWeekendPosterElement,
  GARDE_WEEKEND_POSTER_SIZE,
} from "@/lib/garde-weekend-poster";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ validFrom: string }> },
) {
  const { validFrom } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validFrom)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const snap = await resolveGardeSnapshotForPoster(validFrom);
  if (!snap) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return new ImageResponse(
    GardeWeekendPosterElement({ snap }),
    GARDE_WEEKEND_POSTER_SIZE,
  );
}
