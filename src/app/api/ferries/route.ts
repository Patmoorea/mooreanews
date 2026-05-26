import { NextResponse } from "next/server";
import {
  computeNextDepartures,
  type FerryData,
  type Direction,
} from "@/lib/ferries";

export const revalidate = 1800; // 30 minutes

const FERRY_JSON_URL = "https://www.horaires-tahiti.com/The.json";

export async function GET() {
  try {
    const res = await fetch(FERRY_JSON_URL, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Ferry source ${res.status}`);

    const data = (await res.json()) as FerryData;
    const directions: Direction[] = ["MooreaVersTahiti", "TahitiVersMoorea"];

    const result = directions.map((direction) => ({
      direction,
      departures: computeNextDepartures(data, direction, 4),
    }));

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      directions: result,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 502 }
    );
  }
}
