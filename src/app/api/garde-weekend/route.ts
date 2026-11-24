import { NextResponse } from "next/server";
import { getGardeWeekendHighlight } from "@/lib/garde-weekend-public";
import { PUBLIC_CACHE_CONTROL } from "@/lib/public-cache";

/** Repli 1 h. La publication garde appelle revalidatePath("/api/garde-weekend"). */
export const revalidate = 3600;

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
          "Cache-Control": PUBLIC_CACHE_CONTROL,
        },
      },
    );
  } catch (e) {
    return NextResponse.json({ active: false, error: String(e) }, { status: 502 });
  }
}
