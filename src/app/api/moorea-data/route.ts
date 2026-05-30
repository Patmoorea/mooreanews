import { NextResponse } from "next/server";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { getBeachSwimScores } from "@/lib/swim-beaches";
import { dbListActiveAlerts } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";
export const revalidate = 300;

/** API ouverte « Moorea Data » — ferries, météo, alertes, plages. */
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
        "Cache-Control": "public, s-maxage=300",
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
