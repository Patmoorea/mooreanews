/**
 * Notifications push Web (VAPID) — alertes par quartier.
 */

import webpush from "web-push";
import { Resend } from "resend";
import { ENV, SITE } from "@/lib/constants";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AlertRow } from "@/lib/supabase/types";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  districts?: string[];
};

function vapidConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim(),
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
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
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
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      districts,
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
      if (!pushConfigured) break;

      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          JSON.stringify(payload),
        );
        pushSent += 1;
      } catch (e) {
        const msg = String(e);
        if (/410|404|expired|unsubscribed/i.test(msg)) {
          await admin.from("push_subscriptions").delete().eq("id", row.id);
        } else {
          errors.push(`push: ${msg.slice(0, 120)}`);
        }
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
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (e) {
      const msg = String(e);
      if (/410|404|expired|unsubscribed/i.test(msg)) {
        await admin.from("push_subscriptions").delete().eq("id", row.id);
      } else {
        errors.push(msg.slice(0, 120));
      }
    }
  }

  return { sent, errors };
}
