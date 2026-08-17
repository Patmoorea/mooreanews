import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  getTahitiClock,
  shouldDiscoverWeekendEvents,
} from "@/lib/cron-tahiti";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import { discoverWeekendMooreaEvents } from "@/lib/web-event-discovery";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function notifyDiscovery(
  result: Awaited<ReturnType<typeof discoverWeekendMooreaEvents>>,
  clockLabel: string,
): Promise<void> {
  if (result.discovered === 0 && result.errors.length === 0) return;

  const lines = [
    `<b>🗓️ Veille agenda Moorea</b>`,
    escapeHtml(clockLabel),
    `Semaine cible : ${escapeHtml(result.weekLabel)}`,
    `Trouvés : <b>${result.discovered}</b> · créés ${result.inserted} · maj ${result.updated}`,
  ];

  const sources = Object.entries(result.bySource)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
  if (sources) lines.push(escapeHtml(sources));

  for (const t of result.titles.slice(0, 8)) {
    lines.push(`• ${escapeHtml(t)}`);
  }
  if (result.errors[0]) {
    lines.push(`⚠️ ${escapeHtml(result.errors[0].slice(0, 180))}`);
  }

  await sendTelegramNotification(lines.join("\n"));
}

/**
 * Fin de semaine : fouille le web (Fenua Agenda, Tahiti Tourisme, marchés,
 * croisières…) et publie les événements Moorea pour la semaine à venir.
 */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const clock = getTahitiClock();

  if (!force && !shouldDiscoverWeekendEvents(clock)) {
    return NextResponse.json({
      skipped: true,
      reason: "hors créneau fin de semaine Tahiti (ven. soir / sam. matin)",
      tahiti: clock.label,
    });
  }

  try {
    const result = await discoverWeekendMooreaEvents();

    revalidatePath("/evenements");
    revalidatePath("/", "layout");

    try {
      await notifyDiscovery(result, clock.label);
    } catch (err) {
      console.error("[discover-weekend-events telegram]", err);
    }

    return NextResponse.json({
      tahiti: clock.label,
      forced: force,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[discover-weekend-events]", message);
    return NextResponse.json(
      {
        ok: false,
        error: message.slice(0, 500),
        tahiti: clock.label,
        forced: force,
      },
      { status: 500 },
    );
  }
}

export const POST = GET;
