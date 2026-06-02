/**
 * Alerte ferry / transport depuis une publication Facebook (affiche ou texte).
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AlertSeverity, AlertType } from "@/lib/supabase/types";
import {
  isFacebookAlertJunk,
  isFerryTransportNotice,
} from "@/lib/ferry-notice-detect";
import { titleFromMessage } from "@/lib/facebook-post-parse";

export { isFerryTransportNotice } from "@/lib/ferry-notice-detect";

function autoAlertsEnabled(): boolean {
  return process.env.AUTO_ALERTS_FROM_VEILLE === "true";
}

/** Désactive les alertes ferry invalides ou expirées (faux positifs, promo FB). */
export async function deactivateFalseFerryAlerts(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const { data: rows } = await admin
    .from("alerts")
    .select("id, title, details, ends_at")
    .eq("type", "ferry")
    .eq("active", true);

  const now = Date.now();
  let n = 0;
  for (const row of rows ?? []) {
    const corpus = `${row.title} ${row.details ?? ""}`;
    const expired = Boolean(row.ends_at && Date.parse(row.ends_at) <= now);
    const invalid =
      isFacebookAlertJunk(corpus) || !isFerryTransportNotice(corpus);
    if (!expired && !invalid) continue;
    const { error } = await admin
      .from("alerts")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (!error) n += 1;
  }
  return n;
}

/** Crée une alerte ferry active si le texte correspond (sans doublon URL). */
export async function tryImportFacebookAlert(opts: {
  message: string;
  permalink?: string;
  imageUrl?: string;
  fallbackTitle?: string;
}): Promise<{ created: boolean; title?: string }> {
  if (!autoAlertsEnabled()) return { created: false };

  const message = opts.message.trim();
  if (!isFerryTransportNotice(message)) return { created: false };

  const sourceUrl =
    opts.permalink?.trim() || opts.imageUrl?.trim() || "";
  if (!sourceUrl) return { created: false };

  const admin = getAdminSupabase();
  if (!admin) return { created: false };

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await admin
    .from("alerts")
    .select("id")
    .eq("source_url", sourceUrl)
    .gte("created_at", since)
    .maybeSingle();

  if (existing) return { created: false };

  const title = titleFromMessage(
    message,
    opts.fallbackTitle ?? "Info ferry — Moorea",
  );
  const endsAt = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();
  const details =
    message.slice(0, 500) +
    (opts.imageUrl?.trim()
      ? `\n\nAffiche : ${opts.imageUrl.trim()}`
      : "");

  const type: AlertType = "ferry";
  const severity: AlertSeverity = /annul|indisponib|interruption|carenage|carénage/i.test(
    message,
  )
    ? "warning"
    : "info";

  const { data: inserted, error } = await admin
    .from("alerts")
    .insert({
      type,
      severity,
      title: title.slice(0, 200),
      details: details.trim() || null,
      source_url: sourceUrl,
      starts_at: new Date().toISOString(),
      ends_at: endsAt,
      active: true,
      urgent: severity === "warning",
    })
    .select("*")
    .single();

  if (error || !inserted) return { created: false };

  try {
    const { notifyAlertSubscribers } = await import("@/lib/push-notify");
    await notifyAlertSubscribers(inserted);
  } catch {
    /* non bloquant */
  }

  return { created: true, title: inserted.title };
}
