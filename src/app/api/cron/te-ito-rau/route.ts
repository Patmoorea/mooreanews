import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { importTeItoRauOutageArticlesFromFallback } from "@/lib/outage-te-ito-fallback";
import { syncUtilityOutages } from "@/lib/utility-outages-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Poll Te Ito Rau (coupures) — indépendant de la limite 1 post/h Facebook. */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const imported = await importTeItoRauOutageArticlesFromFallback();
    const utilityOutages = await syncUtilityOutages();

    if (
      utilityOutages.created > 0 ||
      utilityOutages.updated > 0 ||
      imported.articlesCreated > 0
    ) {
      revalidatePath("/alertes");
      revalidatePath("/coupures");
      revalidatePath("/actualites");
      revalidatePath("/", "layout");
    }

    return NextResponse.json({
      ok: true,
      teIto: imported,
      utilityOutages,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 });
  }
}
