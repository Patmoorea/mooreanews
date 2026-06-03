import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { syncUtilityOutages } from "@/lib/utility-outages-sync";

export const dynamic = "force-dynamic";

/** Sync coupures EDT + eau (manuel ou cron horaire). */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await syncUtilityOutages();
  if (result.created > 0 || result.updated > 0 || result.cleared > 0) {
    revalidatePath("/alertes");
    revalidatePath("/coupures");
    revalidatePath("/", "layout");
  }

  return NextResponse.json(result);
}

export const POST = GET;
