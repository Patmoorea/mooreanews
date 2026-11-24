import { NextResponse } from "next/server";
import { dbListActiveAlerts } from "@/lib/supabase/queries";
import { PUBLIC_CACHE_CONTROL } from "@/lib/public-cache";

/** Lecture seule. L'expiration en base est faite par le cron daily. */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const rows = (await dbListActiveAlerts()) ?? [];
  return NextResponse.json(
    {
      ok: true,
      alerts: rows,
    },
    {
      headers: {
        "Cache-Control": PUBLIC_CACHE_CONTROL,
      },
    },
  );
}
