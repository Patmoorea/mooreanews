import { NextResponse } from "next/server";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";

export const revalidate = 300;

export async function GET() {
  const data = await getMooreaDuJour();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
