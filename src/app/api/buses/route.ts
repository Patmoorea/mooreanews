import { NextResponse } from "next/server";
import { getBundledNextBusDepartures } from "@/lib/buses";
import { PUBLIC_CACHE_CONTROL } from "@/lib/public-cache";

/** Horaires embarqués au build ; prochains bus recalculés au plus toutes les heures. */
export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const data = getBundledNextBusDepartures();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": PUBLIC_CACHE_CONTROL,
    },
  });
}
