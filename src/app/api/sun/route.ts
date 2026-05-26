import { NextResponse } from "next/server";
import { getSunMoonData } from "@/lib/sun";

export const revalidate = 21600;

export async function GET() {
  const data = await getSunMoonData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
