import { NextResponse } from "next/server";
import { getNextBusDepartures } from "@/lib/buses";

export const revalidate = 1800;

export async function GET() {
  const data = await getNextBusDepartures();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
