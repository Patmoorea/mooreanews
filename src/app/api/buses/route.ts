import { NextResponse } from "next/server";
import { getNextBusDepartures } from "@/lib/buses";

export const revalidate = 120;

export async function GET() {
  const data = await getNextBusDepartures();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
