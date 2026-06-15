/**
 * Alertes ferry / météo depuis publications Facebook (affiche ou texte).
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AlertSeverity, AlertType } from "@/lib/supabase/types";
import { isCycloneMeteoNotice } from "@/lib/facebook-content-route";
import { isRealHouleAlertNotice } from "@/lib/alert-auto-import";
import { isAlertImportBlocked } from "@/lib/import-blocklist";
import {
  isFacebookPageBoilerplate,
  isFerryPromoArticle,
  isFerryTransportNotice,
} from "@/lib/ferry-notice-detect";
import { titleFromMessage } from "@/lib/facebook-post-parse";

export { isFerryTransportNotice } from "@/lib/ferry-notice-detect";

function autoAlertsEnabled(): boolean {
  return process.env.AUTO_ALERTS_FROM_VEILLE === "true";
}

async function insertFacebookAlert(opts: {
  type: AlertType;
  severity: AlertSeverity;
  urgent: boolean;
  title: string;
  message: string;
  sourceUrl: string;
  imageUrl?: string;
  durationHours: number;
}): Promise<{ created: boolean; title?: string }> {
  const admin = getAdminSupabase();
  if (!admin) return { created: false };

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await admin
    .from("alerts")
    .select("id")
    .eq("source_url", opts.sourceUrl)
    .gte("created_at", since)
    .maybeSingle();

  if (existing) return { created: false };

  if (
    await isAlertImportBlocked({
      sourceUrl: opts.sourceUrl,
      title: opts.title,
    })
  ) {
    return { created: false };
  }

  const endsAt = new Date(
    Date.now() + opts.durationHours * 60 * 60 * 1000,
  ).toISOString();
  const details =
    opts.message.slice(0, 500) +
    (opts.imageUrl?.trim() ? `\n\nAffiche : ${opts.imageUrl.trim()}` : "");

  const { data: inserted, error } = await admin
    .from("alerts")
    .insert({
      type: opts.type,
      severity: opts.severity,
      title: opts.title.slice(0, 200),
      details: details.trim() || null,
      source_url: opts.sourceUrl,
      starts_at: new Date().toISOString(),
      ends_at: endsAt,
      active: true,
      urgent: opts.urgent,
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

/** Désactive les fausses alertes houle (articles sport / va'a mal classés). */
export async function deactivateFalseHouleAlerts(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const { data: rows } = await admin
    .from("alerts")
    .select("id, title, details")
    .eq("type", "houle")
    .eq("active", true);

  let n = 0;
  for (const row of rows ?? []) {
    const corpus = `${row.title} ${row.details ?? ""}`;
    if (isRealHouleAlertNotice(corpus)) continue;
    const { error } = await admin
      .from("alerts")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (!error) n += 1;
  }
  return n;
}

/** Désactive les alertes ferry invalides (coquille FB, promo, pas vraie coupure). */
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
      isFacebookPageBoilerplate(corpus) ||
      isFerryPromoArticle(corpus) ||
      !isFerryTransportNotice(corpus);
    if (!expired && !invalid) continue;
    const { error } = await admin
      .from("alerts")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (!error) n += 1;
  }
  return n;
}

/** Alerte ferry (carénage, annulation, perturbation). */
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

  const title = titleFromMessage(
    message,
    opts.fallbackTitle ?? "Info ferry — Moorea",
  );
  const severity: AlertSeverity = /annul|indisponib|interruption|carenage|carénage/i.test(
    message,
  )
    ? "warning"
    : "info";

  return insertFacebookAlert({
    type: "ferry",
    severity,
    urgent: severity === "warning",
    title,
    message,
    sourceUrl,
    imageUrl: opts.imageUrl,
    durationHours: 36,
  });
}

/** Alerte météo / cyclone depuis Facebook (Infos cyclones, bulletin…). */
export async function tryImportFacebookMeteoAlert(opts: {
  message: string;
  permalink?: string;
  imageUrl?: string;
  sourceLabel?: string;
  fallbackTitle?: string;
}): Promise<{ created: boolean; title?: string }> {
  if (!autoAlertsEnabled()) return { created: false };

  const message = opts.message.trim();
  if (!isCycloneMeteoNotice(message, opts.sourceLabel)) {
    return { created: false };
  }

  const sourceUrl =
    opts.permalink?.trim() || opts.imageUrl?.trim() || "";
  if (!sourceUrl) return { created: false };

  const title = titleFromMessage(
    message,
    opts.fallbackTitle ?? "Vigilance météo — Polynésie",
  );
  const urgent = /cyclone|tempete tropicale|tempête tropicale|alerte rouge/i.test(
    message,
  );

  return insertFacebookAlert({
    type: "meteo",
    severity: urgent ? "alert" : "warning",
    urgent,
    title,
    message,
    sourceUrl,
    imageUrl: opts.imageUrl,
    durationHours: 48,
  });
}
