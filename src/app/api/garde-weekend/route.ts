import { NextResponse } from "next/server";
import { getGardeWeekendHighlight } from "@/lib/garde-weekend-public";

/** ISR 3 min. La publication garde appelle revalidatePath("/api/garde-weekend"). */
export const revalidate = 180;

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
            "public, max-age=60, s-maxage=180, stale-while-revalidate=300",
        },
      },
    );
  } catch (e) {
    return NextResponse.json({ active: false, error: String(e) }, { status: 502 });
  }
}
