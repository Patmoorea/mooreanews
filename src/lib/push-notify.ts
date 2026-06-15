/**
 * Notifications push Web (VAPID) — alertes par quartier.
 */

import webpush from "web-push";
import { Resend } from "resend";
import { ENV, SITE } from "@/lib/constants";
import {
  isValidPushSubscriptionKeys,
  isValidVapidPublicKey,
  pushKeysErrorMessage,
} from "@/lib/push-keys";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AlertRow } from "@/lib/supabase/types";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import {
  formatEveningBrief,
  formatMorningBrief30s,
} from "@/lib/moorea-brief";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  districts?: string[];
  topics?: string[];
};

export type DigestTopic = "morning" | "evening" | "weekend";

const DEFAULT_PUSH_TOPICS = ["alerts", "morning", "evening", "weekend"] as const;

export function subscriptionWantsTopic(
  topics: string[] | null | undefined,
  topic: DigestTopic | "alerts",
): boolean {
  if (!topics?.length) return true;
  return topics.includes(topic);
}

function vapidConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  return Boolean(
    publicKey && privateKey && isValidVapidPublicKey(publicKey),
  );
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() ?? null;
}

function configureWebPush(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() ??
    `mailto:${SITE.email}`;
  if (!publicKey || !privateKey || !isValidVapidPublicKey(publicKey)) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function deleteInvalidPushRow(
  admin: NonNullable<ReturnType<typeof getAdminSupabase>>,
  rowId: string,
): Promise<void> {
  await admin.from("push_subscriptions").delete().eq("id", rowId);
}

function pushErrorStatusCode(err: unknown): number | undefined {
  if (err && typeof err === "object") {
    const o = err as { statusCode?: number; status?: number };
    const code = o.statusCode ?? o.status;
    if (typeof code === "number" && Number.isFinite(code)) return code;
  }
  const match = String(err).match(/response code[:\s]+(\d{3})/i);
  if (match?.[1]) return Number(match[1]);
  return undefined;
}

/** Abonnement révoqué / expiré (410, 404, 403 FCM, etc.) — à supprimer en base. */
function isStalePushSubscriptionError(err: unknown): boolean {
  const code = pushErrorStatusCode(err);
  if (code === 410 || code === 404 || code === 403 || code === 401) return true;
  const msg = String(err).toLowerCase();
  return (
    /410|404|403|401/.test(msg) ||
    msg.includes("expired") ||
    msg.includes("unsubscribed") ||
    msg.includes("65 bytes") ||
    (msg.includes("subscription") && msg.includes("not found"))
  );
}

function formatPushError(err: unknown): string {
  const code = pushErrorStatusCode(err);
  const msg = err instanceof Error ? err.message : String(err);
  return code ? `${code}: ${msg}` : msg;
}

async function sendPushToRow(
  admin: NonNullable<ReturnType<typeof getAdminSupabase>>,
  row: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: Record<string, unknown>,
): Promise<"sent" | "purged" | "error"> {
  if (!isValidPushSubscriptionKeys(row.p256dh, row.auth)) {
    await deleteInvalidPushRow(admin, row.id);
    return "purged";
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      },
      JSON.stringify(payload),
    );
    return "sent";
  } catch (e) {
    if (isStalePushSubscriptionError(e)) {
      await deleteInvalidPushRow(admin, row.id);
      return "purged";
    }
    throw e;
  }
}

/** Supprime les abonnements corrompus (tests curl, anciennes clés…). */
export async function purgeInvalidPushSubscriptions(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const { data: rows } = await admin.from("push_subscriptions").select("id, p256dh, auth");
  let deleted = 0;
  for (const row of rows ?? []) {
    if (!isValidPushSubscriptionKeys(row.p256dh, row.auth)) {
      await deleteInvalidPushRow(admin, row.id);
      deleted += 1;
    }
  }
  return deleted;
}

/** Abonnement pertinent : quartiers choisis + alertes île entière (district null). */
export function subscriptionMatchesAlert(
  districts: string[],
  alert: Pick<AlertRow, "district">,
): boolean {
  if (!districts.length) return true;
  if (!alert.district) return true;
  return districts.includes(alert.district);
}

export async function savePushSubscription(
  input: PushSubscriptionInput,
  userAgent?: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = getAdminSupabase();
  if (!admin) return { ok: false, error: "Supabase non configuré" };

  const districts = (input.districts ?? []).filter(Boolean);
  const topics = (input.topics ?? [...DEFAULT_PUSH_TOPICS]).filter(Boolean);
  if (!isValidPushSubscriptionKeys(input.keys.p256dh, input.keys.auth)) {
    return {
      ok: false,
      error: pushKeysErrorMessage(input.keys.p256dh, input.keys.auth),
    };
  }

  const { error } = await admin.from("push_subscriptions").upsert(
    {
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      districts,
      topics,
      user_agent: userAgent ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveAlertEmailSubscription(
  email: string,
  districts: string[],
): Promise<{ ok: boolean; error?: string }> {
  const admin = getAdminSupabase();
  if (!admin) return { ok: false, error: "Supabase non configuré" };

  const { error } = await admin.from("alert_email_subscriptions").upsert(
    { email: email.trim().toLowerCase(), districts: districts.filter(Boolean) },
    { onConflict: "email" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function alertUrl(alert: AlertRow): string {
  return `${SITE.url.replace(/\/$/, "")}/alertes`;
}

function pushPayload(alert: AlertRow) {
  const base = SITE.url.replace(/\/$/, "");
  return {
    title: alert.urgent ? `🚨 ${alert.title}` : `⚠️ ${alert.title}`,
    body: alert.details?.slice(0, 180) ?? "Nouvelle alerte MooreaNews",
    url: `${base}/alertes`,
    tag: `alert-${alert.id}`,
    urgent: alert.urgent,
  };
}

export async function notifyAlertSubscribers(
  alert: AlertRow,
): Promise<{ pushSent: number; emailsSent: number; newsletterSent: number; errors: string[] }> {
  if (!alert.active) {
    return { pushSent: 0, emailsSent: 0, newsletterSent: 0, errors: [] };
  }

  const admin = getAdminSupabase();
  const errors: string[] = [];
  let pushSent = 0;
  let emailsSent = 0;
  let newsletterSent = 0;

  if (admin) {
    const { data: pushRows } = await admin.from("push_subscriptions").select("*");
    const payload = pushPayload(alert);
    const pushConfigured = configureWebPush();

    for (const row of pushRows ?? []) {
      if (!subscriptionMatchesAlert(row.districts ?? [], alert)) continue;
      if (!subscriptionWantsTopic(row.topics, "alerts")) continue;
      if (!pushConfigured) break;

      try {
        const outcome = await sendPushToRow(admin, row, payload);
        if (outcome === "sent") pushSent += 1;
      } catch (e) {
        errors.push(formatPushError(e));
      }
    }

    if (ENV.resendKey) {
      const { data: emailRows } = await admin
        .from("alert_email_subscriptions")
        .select("email, districts");
      const resend = new Resend(ENV.resendKey);
      const url = alertUrl(alert);

      for (const row of emailRows ?? []) {
        if (!subscriptionMatchesAlert(row.districts ?? [], alert)) continue;
        const result = await resend.emails.send({
          from: ENV.resendFrom,
          to: [row.email],
          subject: alert.urgent
            ? `🚨 Alerte Moorea — ${alert.title}`
            : `⚠️ Alerte Moorea — ${alert.title}`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:560px;padding:20px">
              <h2 style="color:#0c4a6e">${alert.title}</h2>
              ${alert.district ? `<p><strong>Quartier :</strong> ${alert.district}</p>` : ""}
              ${alert.details ? `<p>${alert.details.replace(/\n/g, "<br>")}</p>` : ""}
              <p><a href="${url}">Voir sur MooreaNews →</a></p>
            </div>
          `,
          text: `${alert.title}\n${alert.details ?? ""}\n${url}`,
        });
        if (!result.error) emailsSent += 1;
      }

      if (alert.urgent) {
        const { data: newsletterRows } = await admin
          .from("newsletter_subscribers")
          .select("email")
          .eq("confirmed", true);
        const alertEmails = new Set(
          (emailRows ?? []).map((r) => r.email.toLowerCase()),
        );

        for (const row of newsletterRows ?? []) {
          if (alertEmails.has(row.email.toLowerCase())) continue;
          const result = await resend.emails.send({
            from: ENV.resendFrom,
            to: [row.email],
            subject: `🚨 URGENT Moorea — ${alert.title}`,
            html: `
            <div style="font-family:Inter,sans-serif;max-width:560px;padding:20px;border-left:4px solid #dc2626">
              <h2 style="color:#dc2626">Alerte urgente</h2>
              <h3 style="color:#0c4a6e">${alert.title}</h3>
              ${alert.district ? `<p><strong>Quartier :</strong> ${alert.district}</p>` : ""}
              ${alert.details ? `<p>${alert.details.replace(/\n/g, "<br>")}</p>` : ""}
              <p><a href="${url}">Voir sur MooreaNews →</a></p>
            </div>
          `,
            text: `URGENT: ${alert.title}\n${alert.details ?? ""}\n${url}`,
          });
          if (!result.error) newsletterSent += 1;
        }
      }
    }
  }

  return { pushSent, emailsSent, newsletterSent, errors };
}

export function isPushAvailable(): boolean {
  return vapidConfigured();
}

export async function getPushSubscriberCounts(): Promise<{
  push: number;
  email: number;
  tableOk: boolean;
}> {
  const admin = getAdminSupabase();
  if (!admin) return { push: 0, email: 0, tableOk: false };

  const { error: pushErr, count: pushCount } = await admin
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true });
  const { count: emailCount } = await admin
    .from("alert_email_subscriptions")
    .select("id", { count: "exact", head: true });

  return {
    push: pushCount ?? 0,
    email: emailCount ?? 0,
    tableOk: !pushErr,
  };
}

/** Notification test admin — tous les abonnés push. */
export async function sendTestPushNotification(): Promise<{
  sent: number;
  errors: string[];
}> {
  const admin = getAdminSupabase();
  if (!admin) return { sent: 0, errors: ["Supabase non configuré"] };
  if (!configureWebPush()) {
    return { sent: 0, errors: ["VAPID non configuré sur Vercel"] };
  }

  await purgeInvalidPushSubscriptions();

  const payload = {
    title: "🔔 Test MooreaNews",
    body: "Les notifications push fonctionnent. Vous recevrez les alertes de votre quartier ici.",
    url: `${SITE.url.replace(/\/$/, "")}/alertes`,
    tag: "mooreanews-test",
    urgent: false,
  };

  const { data: rows } = await admin.from("push_subscriptions").select("*");
  let sent = 0;
  const errors: string[] = [];

  for (const row of rows ?? []) {
    try {
      const outcome = await sendPushToRow(admin, row, payload);
      if (outcome === "sent") sent += 1;
    } catch (e) {
      const code = pushErrorStatusCode(e);
      errors.push(`${code ?? "?"}: ${String(e).slice(0, 100)}`);
    }
  }

  if (sent === 0 && errors.length === 0) {
    errors.push(
      "Aucun abonné valide — réactivez les notifications sur /alertes.",
    );
  }

  return { sent, errors };
}

async function sendDigestToTopic(
  topic: DigestTopic,
  payload: { title: string; body: string; url: string },
): Promise<{ sent: number; purged: number; errors: string[] }> {
  const admin = getAdminSupabase();
  if (!admin || !configureWebPush()) {
    return { sent: 0, purged: 0, errors: ["Push non configuré"] };
  }

  const purgedInvalid = await purgeInvalidPushSubscriptions();

  const { data: rows } = await admin.from("push_subscriptions").select("*");
  let sent = 0;
  let purgedStale = 0;
  const errors: string[] = [];

  const pushPayload = {
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: `digest-${topic}`,
    urgent: false,
  };

  for (const row of rows ?? []) {
    if (!subscriptionWantsTopic(row.topics, topic)) continue;

    try {
      const outcome = await sendPushToRow(admin, row, pushPayload);
      if (outcome === "sent") sent += 1;
      else if (outcome === "purged") purgedStale += 1;
    } catch (e) {
      errors.push(formatPushError(e));
    }
  }

  return { sent, purged: purgedInvalid + purgedStale, errors: errors.slice(0, 5) };
}

/** Push matin « Moorea en 30 secondes » (~7h Tahiti via cron). */
export async function sendMorningDigestPush(): Promise<{
  sent: number;
  purged: number;
  errors: string[];
}> {
  const digest = await getMooreaDuJour();
  const brief = formatMorningBrief30s(digest);
  const base = SITE.url.replace(/\/$/, "");
  return sendDigestToTopic("morning", {
    title: brief.title,
    body: brief.body,
    url: `${base}/`,
  });
}

/** Push « Ce soir à Moorea » (jeu–dim ~17h, cron externe ou fenêtre cron). */
export async function sendEveningDigestPush(): Promise<{
  sent: number;
  purged: number;
  errors: string[];
}> {
  const digest = await getMooreaDuJour();
  const brief = formatEveningBrief(digest);
  const base = SITE.url.replace(/\/$/, "");
  return sendDigestToTopic("evening", {
    title: brief.title,
    body: brief.body,
    url: `${base}/ce-soir`,
  });
}

/** Push agenda week-end. */
export async function sendWeekendDigestPush(): Promise<{
  sent: number;
  purged: number;
  errors: string[];
}> {
  const digest = await getMooreaDuJour();
  const n = digest.weekendEvents.length;
  const base = SITE.url.replace(/\/$/, "");
  const body =
    n > 0
      ? digest.weekendEvents
          .slice(0, 3)
          .map((e) => e.title)
          .join(" · ")
      : "Consultez l'agenda du week-end sur MooreaNews.";
  return sendDigestToTopic("weekend", {
    title: "🌴 Ce week-end à Moorea",
    body: body.slice(0, 220),
    url: `${base}/evenements`,
  });
}
