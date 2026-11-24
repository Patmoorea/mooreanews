import { NextResponse } from "next/server";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { getBeachSwimScores } from "@/lib/swim-beaches";
import { dbListActiveAlerts } from "@/lib/supabase/queries";

import { PUBLIC_CACHE_CONTROL } from "@/lib/public-cache";

export const dynamic = "force-static";
export const revalidate = 3600;

/**
 * API ouverte « Moorea Data ».
 * OPTIONS (prévol CORS) empêche le pré-rendu du segment ; le GET reste
 * mis en cache au CDN via Cache-Control (s-maxage=3600).
 */
export async function GET() {
  const [digest, beaches, alerts] = await Promise.all([
    getMooreaDuJour(),
    getBeachSwimScores(),
    dbListActiveAlerts(),
  ]);

  return NextResponse.json(
    {
      generatedAt: digest.generatedAt,
      site: digest.siteUrl,
      weather: digest.weather,
      swim: digest.swim,
      tides: digest.tides,
      ferries: digest.ferries,
      alerts: (alerts ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        district: a.district,
        urgent: a.urgent,
      })),
      beaches: beaches.map((b) => ({
        slug: b.beach.slug,
        name: b.beach.name,
        status: b.status,
        label: b.label,
      })),
      eventsToday: digest.todayEvents,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": PUBLIC_CACHE_CONTROL,
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
