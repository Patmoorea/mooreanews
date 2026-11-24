import { NextResponse } from "next/server";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { PUBLIC_CACHE_CONTROL } from "@/lib/public-cache";

export const revalidate = 3600;

export async function GET() {
  const data = await getMooreaDuJour();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": PUBLIC_CACHE_CONTROL,
    },
  });
}
