import { NextResponse } from "next/server";
import { getWeeklyRecapHighlight } from "@/lib/weekly-recap-public";

export const revalidate = 600;

export async function GET() {
  try {
    const highlight = await getWeeklyRecapHighlight();
    if (!highlight) {
      return NextResponse.json({ active: false });
    }
    return NextResponse.json(
      {
        active: true,
        href: highlight.href,
        label: highlight.label,
        isFresh: highlight.isFresh,
        articleSlug: highlight.articleSlug,
        weekLabel: highlight.weekLabel,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=120, s-maxage=600, stale-while-revalidate=1800",
        },
      },
    );
  } catch (e) {
    return NextResponse.json({ active: false, error: String(e) }, { status: 502 });
  }
}
