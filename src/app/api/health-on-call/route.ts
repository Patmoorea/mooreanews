import { NextResponse } from "next/server";
import { getHealthOnCall } from "@/lib/health-on-call";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getHealthOnCall();
  const empty = !data.onDutyDoctor && !data.onDutyPharmacy;
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": empty
        ? "public, max-age=300, s-maxage=600, stale-while-revalidate=1800"
        : "public, max-age=600, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
