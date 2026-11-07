import { NextResponse } from "next/server";
import { getRecentMooreaJobOffers } from "@/lib/employment-listings";

export const revalidate = 3600;

export async function GET() {
  try {
    const offers = await getRecentMooreaJobOffers(12, 30);
    return NextResponse.json(
      { offers },
      {
        headers: {
          "Cache-Control":
            "public, max-age=600, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    );
  } catch (e) {
    return NextResponse.json({ offers: [], error: String(e) }, { status: 502 });
  }
}
