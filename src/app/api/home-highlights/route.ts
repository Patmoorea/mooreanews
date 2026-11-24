import { NextResponse } from "next/server";
import { getHomeHighlights } from "@/lib/home-highlights";
import { PUBLIC_CACHE_CONTROL } from "@/lib/public-cache";

/**
 * Bandeau d'accueil. Repli 1 h ; les crons (coupures, garde, récap)
 * appellent revalidatePath("/api/home-highlights").
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  try {
    const highlights = await getHomeHighlights();
    return NextResponse.json(
      { highlights },
      {
        headers: {
          "Cache-Control": PUBLIC_CACHE_CONTROL,
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
