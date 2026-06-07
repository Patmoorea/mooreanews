import { NextResponse } from "next/server";
import { getGardeWeekendHighlight } from "@/lib/garde-weekend-public";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const highlight = await getGardeWeekendHighlight();
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
        weekendLabel: highlight.weekendLabel,
        doctorName: highlight.doctorName,
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
