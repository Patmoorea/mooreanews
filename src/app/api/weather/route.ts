import { NextResponse } from "next/server";
import { getCurrentWeather } from "@/lib/weather";
import { PUBLIC_CACHE_CONTROL } from "@/lib/public-cache";

export const revalidate = 3600;

export async function GET() {
  const data = await getCurrentWeather();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": PUBLIC_CACHE_CONTROL,
    },
  });
}
