import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  DAILY_CRON_PARTS,
  runDailyCron,
  runDailyCronPart,
  type DailyCronPart,
} from "@/lib/cron-daily";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Job quotidien MooreaNews.
 * - Sans part : tout le job (local / Pro Vercel).
 * - part=maintenance|digests|… + wait=1 : une étape (< 60 s, GitHub Actions).
 */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const partRaw = url.searchParams.get("part")?.trim().toLowerCase() ?? "";
  const wait = url.searchParams.get("wait") === "1";

  if (partRaw) {
    if (!DAILY_CRON_PARTS.includes(partRaw as DailyCronPart)) {
      return NextResponse.json(
        { error: "invalid_part", parts: [...DAILY_CRON_PARTS] },
        { status: 400 },
      );
    }
    try {
      return NextResponse.json(
        await runDailyCronPart(partRaw as DailyCronPart),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[cron/daily]", partRaw, message);
      return NextResponse.json(
        { ok: false, part: partRaw, error: message.slice(0, 500) },
        { status: 500 },
      );
    }
  }

  if (!wait) {
    return NextResponse.json(
      {
        ok: false,
        error: "use_part_or_wait",
        hint: "GitHub : part=maintenance&wait=1 … | Test complet : wait=1",
        parts: [...DAILY_CRON_PARTS],
      },
      { status: 400 },
    );
  }

  try {
    const result = await runDailyCron();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/daily]", message);
    return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 });
  }
}

export const POST = GET;
