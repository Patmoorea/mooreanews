import { getAdminSupabase } from "@/lib/supabase/admin";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import {
  probePublicPages,
  siteBaseUrl,
  type PageProbe,
} from "@/lib/site-health-probe";

const STATE_ID = "site-health-watch";
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

type WatchState = {
  down: boolean;
  lastAlertAt: number;
};

async function readWatchState(): Promise<WatchState> {
  const admin = getAdminSupabase();
  if (!admin) return { down: false, lastAlertAt: 0 };

  const { data } = await admin
    .from("form_rate_limits")
    .select("hits, reset_at")
    .eq("id", STATE_ID)
    .maybeSingle();

  if (!data) return { down: false, lastAlertAt: 0 };
  return {
    down: data.hits > 0,
    lastAlertAt: Date.parse(data.reset_at) || 0,
  };
}

async function writeWatchState(state: WatchState): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;

  await admin.from("form_rate_limits").upsert({
    id: STATE_ID,
    hits: state.down ? 1 : 0,
    reset_at: new Date(
      state.lastAlertAt > 0 ? state.lastAlertAt : Date.now(),
    ).toISOString(),
  });
}

function formatFailures(pages: PageProbe[]): string {
  return pages
    .filter((p) => !p.ok)
    .map(
      (p) =>
        `• <b>${escapeHtml(p.label)}</b> (${escapeHtml(p.path)}) → HTTP ${p.status || "ERR"}`,
    )
    .join("\n");
}

export type SiteHealthWatchResult = {
  ok: boolean;
  base: string;
  pages: PageProbe[];
  telegram: "alert" | "recovery" | "cooldown" | "none";
  checkedAt: string;
};

/** Sonde les pages publiques et alerte Telegram (cooldown 30 min). */
export async function runSiteHealthWatch(): Promise<SiteHealthWatchResult> {
  const base = siteBaseUrl();
  const pages = await probePublicPages(base);
  const ok = pages.every((p) => p.ok);
  const failures = pages.filter((p) => !p.ok);
  const state = await readWatchState();
  const now = Date.now();
  let telegram: SiteHealthWatchResult["telegram"] = "none";

  if (!ok) {
    const shouldAlert =
      !state.down || now - state.lastAlertAt > ALERT_COOLDOWN_MS;
    if (shouldAlert) {
      await sendTelegramNotification(
        [
          "🚨 <b>MooreaNews INDISPONIBLE</b>",
          "",
          formatFailures(failures),
          "",
          escapeHtml(base),
          "",
          "⚠️ Page en HTTP 500 = bug code ou déploiement. Vérifiez Vercel / admin.",
        ].join("\n"),
      );
      await writeWatchState({ down: true, lastAlertAt: now });
      telegram = "alert";
    } else {
      await writeWatchState({ down: true, lastAlertAt: state.lastAlertAt });
      telegram = "cooldown";
    }
  } else if (state.down) {
    await sendTelegramNotification(
      `✅ <b>MooreaNews</b> — site de nouveau OK\n${escapeHtml(base)}`,
    );
    await writeWatchState({ down: false, lastAlertAt: 0 });
    telegram = "recovery";
  } else {
    await writeWatchState({ down: false, lastAlertAt: 0 });
  }

  return {
    ok,
    base,
    pages,
    telegram,
    checkedAt: new Date().toISOString(),
  };
}
