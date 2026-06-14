import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { runVeilleCron } from "@/lib/cron-veille";
import {
  runVeillePartFinish,
  runVeillePartRss,
  runVeillePartWeb,
  runVeillePartAi,
} from "@/lib/cron-veille-chain";
import { notifyVeilleReport } from "@/lib/telegram-notify";
import { auditPublicContent } from "@/lib/site-content-audit";
import { checkFacebookTokenHealth } from "@/lib/facebook-token";

/**
 * Veille horaire (RSS + Facebook + garde).
 * - Sans paramètre : async 202 (navigateur / test rapide).
 * - part=rss|web|finish + wait=1 : étape synchrone (< 60 s, GitHub Actions).
 * - wait=1 sans part : veille complète (Pro Vercel / local uniquement).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function runVeilleAndNotify() {
  const result = await runVeilleCron();
  const articlesSkipped = result.bySource.reduce(
    (s, r) => s + (r.articlesSkipped ?? 0),
    0,
  );
  const eventsCreated = result.bySource.reduce(
    (s, r) => s + (r.eventsCreated ?? 0),
    0,
  );
  const announcementsCreated = result.bySource.reduce(
    (s, r) => s + (r.announcementsCreated ?? 0),
    0,
  );
  const articlesRepaired = result.bySource.reduce(
    (s, r) => s + (r.articlesRepaired ?? 0),
    0,
  );

  await notifyVeilleReport({
    durationMs: result.durationMs,
    totalFetched: result.totalFetched,
    totalInserted: result.totalInserted,
    articlesCreated: result.articlesCreated,
    articlesSkipped,
    articlesRepaired,
    eventsCreated,
    announcementsCreated,
    alertsCreated: result.alertsCreated,
    errors: result.errors,
    bySource: result.bySource,
    createdArticles: result.bySource.flatMap((r) => r.createdArticles ?? []),
    repairedArticles: result.bySource.flatMap((r) => r.repairedArticles ?? []),
    createdEvents: result.bySource.flatMap((r) => r.createdEvents ?? []),
    audit: await auditPublicContent(),
    facebookHealth: await checkFacebookTokenHealth(),
  });

  return result;
}

export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const wait = url.searchParams.get("wait") === "1";
  const part = url.searchParams.get("part")?.trim().toLowerCase() ?? "";

  if (part === "rss" && wait) {
    try {
      return NextResponse.json(await runVeillePartRss());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 });
    }
  }

  if (part === "web" && wait) {
    try {
      return NextResponse.json(await runVeillePartWeb());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 });
    }
  }

  if (part === "finish" && wait) {
    try {
      return NextResponse.json(await runVeillePartFinish());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 });
    }
  }

  if (part === "ai" && wait) {
    try {
      return NextResponse.json(await runVeillePartAi());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ ok: false, error: message.slice(0, 500) }, { status: 500 });
    }
  }

  if (wait) {
    try {
      const result = await runVeilleAndNotify();
      return NextResponse.json({ ...result, legacyRoute: "/api/cron/aggregate" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[cron/aggregate]", message);
      return NextResponse.json(
        { ok: false, error: message.slice(0, 500) },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error: "async_disabled",
      hint:
        "Veille complète : wait=1 (local/Pro). GitHub : part=rss|web|finish|ai + wait=1, puis /api/cron/facebook?wait=1&chain=1",
      legacyRoute: "/api/cron/aggregate",
    },
    { status: 400 },
  );
}

export const POST = GET;
