import { NextResponse } from "next/server";
import { computeNextDepartures, loadFerrySchedules } from "@/lib/ferries";

export const dynamic = "force-dynamic";

export async function GET() {
  const { raw, source } = await loadFerrySchedules();
  const data = computeNextDepartures(raw, source);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
