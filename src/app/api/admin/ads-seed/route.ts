import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { seedAdsSafe } from "@/lib/ads-seed";

/** Initialise les tables pub depuis les valeurs par défaut (admin / cron). */
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin missing" }, { status: 503 });
  }

  try {
    const result = await seedAdsSafe(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
