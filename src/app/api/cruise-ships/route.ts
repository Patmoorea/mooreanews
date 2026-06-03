import { NextResponse } from "next/server";
import { getCruiseShipSchedule } from "@/lib/cruise-ships";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCruiseShipSchedule();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=21600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 502 },
    );
  }
}
