import { after, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { runVeilleCron } from "@/lib/cron-veille";
import { notifyVeilleReport } from "@/lib/telegram-notify";
import { auditPublicContent } from "@/lib/site-content-audit";
import { checkFacebookTokenHealth } from "@/lib/facebook-token";

/**
 * Veille horaire (RSS + Facebook + garde) — répond 202 par défaut (évite timeout ~300 s).
 * GitHub Actions + npm run veille : ajouter wait=1 pour attendre le JSON complet.
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

  if (!wait) {
    after(async () => {
      try {
        await runVeilleAndNotify();
      } catch (err) {
        console.error("[cron/aggregate async]", err);
      }
    });

    return NextResponse.json(
      {
        ok: true,
        started: true,
        async: true,
        hint: "Veille en cours (~2–5 min). Ajouter wait=1 pour attendre le JSON complet.",
        legacyRoute: "/api/cron/aggregate",
      },
      { status: 202 },
    );
  }

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

export const POST = GET;
