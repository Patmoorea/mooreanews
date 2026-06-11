import { NextResponse } from "next/server";
import { getRecentMooreaJobOffers } from "@/lib/employment-listings";

export const revalidate = 1800;

export async function GET() {
  try {
    const offers = await getRecentMooreaJobOffers(12, 30);
    return NextResponse.json(
      { offers },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    );
  } catch (e) {
    return NextResponse.json({ offers: [], error: String(e) }, { status: 502 });
  }
}
