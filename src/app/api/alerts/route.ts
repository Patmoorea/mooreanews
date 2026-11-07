import { NextResponse } from "next/server";
import { expirePastAlerts } from "@/lib/alert-schedule";
import { dbListActiveAlerts } from "@/lib/supabase/queries";

export const revalidate = 600;

export async function GET() {
  await expirePastAlerts();
  const rows = (await dbListActiveAlerts()) ?? [];
  return NextResponse.json(
    {
      ok: true,
      alerts: rows,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
      },
    },
  );
}
