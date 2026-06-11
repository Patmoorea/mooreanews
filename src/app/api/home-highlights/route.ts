import { NextResponse } from "next/server";
import { getHomeHighlights } from "@/lib/home-highlights";

export const revalidate = 600;

export async function GET() {
  try {
    const highlights = await getHomeHighlights();
    return NextResponse.json(
      { highlights },
      {
        headers: {
          "Cache-Control": "public, max-age=120, s-maxage=600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (e) {
    return NextResponse.json(
      { highlights: [], error: String(e) },
      { status: 502 },
    );
  }
}
