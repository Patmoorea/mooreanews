import { NextResponse } from "next/server";
import { getBundledNextDepartures } from "@/lib/ferries";
import { PUBLIC_CACHE_CONTROL } from "@/lib/public-cache";

/** Horaires embarqués au build ; « prochains départs » recalculés au plus toutes les heures. */
export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const data = getBundledNextDepartures();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": PUBLIC_CACHE_CONTROL,
    },
  });
}
