import { NextResponse } from "next/server";
import { getCurrentWeather } from "@/lib/weather";

export const revalidate = 1800;

export async function GET() {
  const data = await getCurrentWeather();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
