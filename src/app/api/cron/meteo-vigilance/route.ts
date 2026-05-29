import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { syncMeteoVigilanceAlert } from "@/lib/meteo-vigilance-sync";

export const dynamic = "force-dynamic";

/** Sync vigilance meteo.pf → alertes (appel manuel entre deux crons). */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await syncMeteoVigilanceAlert();

  if (
    result.action === "created" ||
    result.action === "updated" ||
    result.action === "cleared"
  ) {
    revalidatePath("/alertes");
    revalidatePath("/", "layout");
  }

  return NextResponse.json({ ok: result.action !== "error", ...result });
}

export const POST = GET;
