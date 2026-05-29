/**
 * Digest matinal email pour les abonnés newsletter.
 */

import { Resend } from "resend";
import { ENV, SITE } from "@/lib/constants";
import { escapeHtml } from "@/lib/telegram";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function sendMorningDigest(): Promise<{
  sent: number;
  skipped: boolean;
  error?: string;
}> {
  if (!ENV.resendKey) {
    return { sent: 0, skipped: true, error: "Resend non configuré" };
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return { sent: 0, skipped: true, error: "Supabase non configuré" };
  }

  const { data: subscribers } = await admin
    .from("newsletter_subscribers")
    .select("email")
    .eq("confirmed", true);

  if (!subscribers?.length) {
    return { sent: 0, skipped: true, error: "Aucun abonné confirmé" };
  }

  const digest = await getMooreaDuJour();
  const base = SITE.url.replace(/\/$/, "");
  const nextM = digest.ferries.fromMoorea[0];
  const nextT = digest.ferries.fromTahiti[0];

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0c4a6e">
      <h1 style="font-family:Georgia,serif;color:#0369a1">🌺 Moorea du jour</h1>
      <p style="color:#64748b;font-size:14px">${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Pacific/Tahiti" })} — Tahiti</p>

      <div style="background:#f0f9ff;border-radius:12px;padding:16px;margin:16px 0">
        <h2 style="font-size:16px;margin:0 0 8px">⛴ Ferries</h2>
        ${nextM ? `<p>Moorea → Tahiti : <strong>${escapeHtml(nextM.company)} ${escapeHtml(nextM.time)}</strong> (dans ${nextM.minutesUntil} min)</p>` : ""}
        ${nextT ? `<p>Tahiti → Moorea : <strong>${escapeHtml(nextT.company)} ${escapeHtml(nextT.time)}</strong> (dans ${nextT.minutesUntil} min)</p>` : ""}
        <p><a href="${base}/#en-direct">Horaires complets →</a></p>
      </div>

      <div style="background:#ecfeff;border-radius:12px;padding:16px;margin:16px 0">
        <h2 style="font-size:16px;margin:0 0 8px">🌊 Lagon & météo</h2>
        <p><strong>${digest.weather.temp}°C</strong> — ${escapeHtml(digest.weather.description)}</p>
        <p>${escapeHtml(digest.swim.emoji)} ${escapeHtml(digest.swim.label)}</p>
      </div>

      ${
        digest.alerts.count > 0
          ? `<div style="background:#fef3c7;border-radius:12px;padding:16px;margin:16px 0">
        <h2 style="font-size:16px;margin:0 0 8px">⚠️ Alertes (${digest.alerts.count})</h2>
        <ul>${digest.alerts.items.map((a) => `<li>${escapeHtml(a.title)}</li>`).join("")}</ul>
        <p><a href="${base}/alertes">Voir les alertes →</a></p>
      </div>`
          : ""
      }

      ${
        digest.todayEvents.length > 0
          ? `<div style="background:#fff1f2;border-radius:12px;padding:16px;margin:16px 0">
        <h2 style="font-size:16px;margin:0 0 8px">📅 Aujourd'hui</h2>
        <ul>${digest.todayEvents.map((e) => `<li><a href="${base}/evenements/${e.slug}">${escapeHtml(e.title)}</a></li>`).join("")}</ul>
      </div>`
          : ""
      }

      ${
        digest.headlines.length > 0
          ? `<div style="margin:16px 0">
        <h2 style="font-size:16px">📰 À la une</h2>
        <ul>${digest.headlines.slice(0, 3).map((a) => `<li><a href="${base}/actualites/${a.slug}">${escapeHtml(a.title)}</a></li>`).join("")}</ul>
      </div>`
          : ""
      }

      <p style="margin-top:24px;font-size:13px;color:#64748b">
        <a href="${base}">Ouvrir MooreaNews</a> — L'info de Moorea en Polynésie française
      </p>
    </div>
  `;

  const resend = new Resend(ENV.resendKey);
  let sent = 0;

  for (const row of subscribers) {
    const result = await resend.emails.send({
      from: ENV.resendFrom,
      to: [row.email],
      subject: `🌺 Moorea du jour — ${digest.weather.temp}°C, ferries & alertes`,
      html,
      text: `Moorea du jour — ${digest.weather.temp}°C. Ferries: ${nextM?.company ?? "—"} ${nextM?.time ?? ""}. ${base}`,
    });
    if (!result.error) sent += 1;
  }

  return { sent, skipped: false };
}
