import { NextResponse } from "next/server";
import { getCurrentWeather } from "@/lib/weather";

export const revalidate = 600;

export async function GET() {
  const data = await getCurrentWeather();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        "public, s-maxage=600, stale-while-revalidate=1800",
    },
  });
}
