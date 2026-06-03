import { NextResponse } from "next/server";
import { checkDpamStatsFreshness, getMaritimeTrafficData } from "@/lib/maritime-traffic";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = getMaritimeTrafficData();
  const freshness = await checkDpamStatsFreshness().catch((e) => ({
    latestPdfYear: null,
    latestPdfUrl: null,
    dataYears: [],
    needsUpdate: false,
    message: String(e),
  }));

  return NextResponse.json(
    { ...data, freshness },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
