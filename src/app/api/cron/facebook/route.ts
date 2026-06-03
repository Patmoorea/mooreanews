import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { aggregateFacebookPagesGraph } from "@/lib/facebook-watch";

/** Rattrapage Facebook uniquement (évite le timeout du cron complet). */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const start = Date.now();
  const result = await aggregateFacebookPagesGraph();
  const articles =
    (result.articlesCreated ?? 0) + (result.articlesRepaired ?? 0);
  if (articles > 0) {
    revalidatePath("/actualites");
    revalidatePath("/coupures");
    revalidatePath("/paquebots");
    revalidatePath("/", "layout");
  }
  return NextResponse.json({
    ok: result.errors.length === 0,
    durationMs: Date.now() - start,
    ...result,
  });
}

export const POST = GET;
