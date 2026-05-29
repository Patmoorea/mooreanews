import { NextResponse } from "next/server";
import { aggregateAll } from "@/lib/aggregator";
import { notifyVeilleReport } from "@/lib/telegram-notify";

/**
 * Endpoint d'agrégation RSS + Facebook, appelé par Vercel Cron (1×/jour, 18h Tahiti).
 * Protection :
 * - Vercel Cron envoie un header Authorization: Bearer ${CRON_SECRET}
 * - Sur un appel manuel, le secret peut être passé via ?secret=...
 */
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

  // Sans CRON_SECRET : accepter uniquement le cron Vercel (header officiel)
  if (req.headers.get("x-vercel-cron") === "1") return true;

  return process.env.NODE_ENV !== "production";
}

export async function GET(req: Request) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const results = await aggregateAll();
  const duration = Date.now() - start;

  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  const totalFetched = results.reduce((s, r) => s + r.fetched, 0);
  const errors = results.flatMap((r) =>
    r.errors.map((e) => `${r.source}: ${e}`)
  );

  const articlesCreated = results.reduce(
    (s, r) => s + (r.articlesCreated ?? 0),
    0,
  );
  const articlesSkipped = results.reduce(
    (s, r) => s + (r.articlesSkipped ?? 0),
    0,
  );
  const eventsCreated = results.reduce(
    (s, r) => s + (r.eventsCreated ?? 0),
    0,
  );
  const announcementsCreated = results.reduce(
    (s, r) => s + (r.announcementsCreated ?? 0),
    0,
  );
  const createdArticles = results.flatMap((r) => r.createdArticles ?? []);
  const createdEvents = results.flatMap((r) => r.createdEvents ?? []);

  await notifyVeilleReport({
    durationMs: duration,
    totalFetched,
    totalInserted,
    articlesCreated,
    articlesSkipped,
    eventsCreated,
    announcementsCreated,
    errors,
    bySource: results,
    createdArticles,
    createdEvents,
  });

  return NextResponse.json({
    ok: errors.length === 0,
    durationMs: duration,
    totalFetched,
    totalInserted,
    articlesCreated,
    articlesSkipped,
    eventsCreated,
    announcementsCreated,
    errors,
    bySource: results,
  });
}

export const POST = GET;
