import { NextResponse } from "next/server";
import { getHealthOnCall } from "@/lib/health-on-call";

export const revalidate = 3600;

export async function GET() {
  const data = await getHealthOnCall();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
