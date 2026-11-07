import { NextResponse } from "next/server";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";

export const revalidate = 1800;

export async function GET() {
  const data = await getMooreaDuJour();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
