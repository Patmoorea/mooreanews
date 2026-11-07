import { NextResponse } from "next/server";
import { getHomeHighlights } from "@/lib/home-highlights";

export const revalidate = 1800;

export async function GET() {
  try {
    const highlights = await getHomeHighlights();
    return NextResponse.json(
      { highlights },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
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
