import { NextResponse } from "next/server";
import { computeNextDepartures, fetchRawFerries } from "@/lib/ferries";

export const revalidate = 1800;

export async function GET() {
  const raw = await fetchRawFerries();
  const data = computeNextDepartures(raw);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
