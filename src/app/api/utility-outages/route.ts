import { NextResponse } from "next/server";
import { getUtilityOutages } from "@/lib/utility-outages";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getUtilityOutages();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=10800, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
