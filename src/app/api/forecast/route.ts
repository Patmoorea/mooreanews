import { NextResponse } from "next/server";
import { getForecast } from "@/lib/weather";

export const revalidate = 3600;

export async function GET() {
  const data = await getForecast(5);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
