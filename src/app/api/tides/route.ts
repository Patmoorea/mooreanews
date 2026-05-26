import { NextResponse } from "next/server";
import { getTides } from "@/lib/tides";

export const revalidate = 3600;

export async function GET() {
  const data = getTides();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        "public, s-maxage=3600, stale-while-revalidate=21600",
    },
  });
}
