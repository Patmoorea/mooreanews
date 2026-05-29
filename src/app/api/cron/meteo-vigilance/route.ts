import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncMeteoVigilanceAlert } from "@/lib/meteo-vigilance-sync";

export const dynamic = "force-dynamic";

async function verifyAuth(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();

  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
    const url = new URL(req.url);
    if (url.searchParams.get("secret") === secret) return true;
    return false;
  }

  if (req.headers.get("x-vercel-cron") === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/** Sync vigilance meteo.pf → alertes (après bulletins 5h et 15h Tahiti). */
export async function GET(req: Request) {
  if (!(await verifyAuth(req))) {
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
