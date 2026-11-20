import { NextResponse } from "next/server";
import { getHealthOnCall } from "@/lib/health-on-call";

/** Même fenêtre que /sante-garde. revalidatePath purge à la publication garde. */
export const revalidate = 180;

export async function GET() {
  const data = await getHealthOnCall();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=180, stale-while-revalidate=300",
    },
  });
}
