/**
 * Alerte ferry / transport depuis une publication Facebook (affiche ou texte).
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AlertSeverity, AlertType } from "@/lib/supabase/types";
import { titleFromMessage } from "@/lib/facebook-post-parse";

const FERRY_KEYWORDS = [
  "ferry",
  "traversee",
  "traversée",
  "carenage",
  "carénage",
  "navire",
  "tauati",
  "aremiti",
  "vaearai",
  "avatea",
  "indisponible",
  "perturbation",
  "annulation",
  "retard",
  "debarcadere",
  "débarcadère",
  "interruption",
  "quai",
  "vaiare",
  "papeete",
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isFerryTransportNotice(message: string): boolean {
  const n = normalize(message);
  if (!n.trim()) return false;
  return FERRY_KEYWORDS.some((k) => n.includes(normalize(k)));
}

function autoAlertsEnabled(): boolean {
  return process.env.AUTO_ALERTS_FROM_VEILLE === "true";
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
  const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
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
