import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { forceRepairMooreaNewsByFbid } from "@/lib/facebook-content-import";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** GET /api/watch/facebook-force-repair?secret=...&fbids=123,456 */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const fbids = [
    ...url.searchParams.getAll("fbid"),
    ...(url.searchParams.get("fbids")?.split(/[,;\s]+/) ?? []),
  ]
    .map((s) => s.trim())
    .filter((s) => /^\d{8,}$/.test(s));

  if (fbids.length === 0) {
    return NextResponse.json(
      { ok: false, error: "fbids_required", hint: "Ajouter fbids=1779437383397251" },
      { status: 400 },
    );
  }

  const payload = await forceRepairMooreaNewsByFbid(fbids.slice(0, 5));

  if (payload.results.some((r) => r.ok)) {
    revalidatePath("/actualites");
    revalidatePath("/", "layout");
  }

  return NextResponse.json(payload);
}

export const POST = GET;
