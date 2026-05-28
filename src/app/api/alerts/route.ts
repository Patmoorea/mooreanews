import { NextResponse } from "next/server";
import { dbListActiveAlerts } from "@/lib/supabase/queries";

export const revalidate = 30;

export async function GET() {
  const rows = (await dbListActiveAlerts()) ?? [];
  return NextResponse.json(
    {
      ok: true,
      alerts: rows,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
      },
    },
  );
}

