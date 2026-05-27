import { NextResponse } from "next/server";
import { aggregateAll } from "@/lib/aggregator";
import { sendTelegramNotification } from "@/lib/telegram";

/**
 * Endpoint d'agrégation RSS, appelé par Vercel Cron toutes les heures.
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

  // Notification Telegram si nouveaux articles
  if (totalInserted > 0) {
    const summary = results
      .filter((r) => r.inserted > 0)
      .map((r) => `• ${r.source} : ${r.inserted} nouveau(x)`)
      .join("\n");
    await sendTelegramNotification(
      `🤖 <b>Veille Moorea</b>\n${totalInserted} nouvel(s) article(s) agrégé(s).\n\n${summary}`
    );
  }

  return NextResponse.json({
    ok: errors.length === 0,
    durationMs: duration,
    totalFetched,
    totalInserted,
    errors,
    bySource: results,
  });
}

export const POST = GET;
