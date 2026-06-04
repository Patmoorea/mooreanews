import { NextResponse } from "next/server";
import {
  CRUISE_SCHEDULE_REVALIDATE_SEC,
  getCruiseShipSchedule,
} from "@/lib/cruise-ships";

export const revalidate = 2592000;

export async function GET() {
  try {
    const data = await getCruiseShipSchedule();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, max-age=${CRUISE_SCHEDULE_REVALIDATE_SEC}, s-maxage=${CRUISE_SCHEDULE_REVALIDATE_SEC}`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 502 },
    );
  }
}
