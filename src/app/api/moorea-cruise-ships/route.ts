import { NextResponse } from "next/server";
import {
  getMooreaCruiseSchedule,
  MOOREA_CRUISE_REVALIDATE_SEC,
} from "@/lib/moorea-cruise-schedule";

export const revalidate = 21600;

export async function GET() {
  try {
    const data = await getMooreaCruiseSchedule();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, max-age=${MOOREA_CRUISE_REVALIDATE_SEC}, s-maxage=${MOOREA_CRUISE_REVALIDATE_SEC}`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 502 },
    );
  }
}
