/**
 * Digest « Agenda du week-end » — envoyé le jeudi 17h (Tahiti).
 */

import { Resend } from "resend";
import { ENV, SITE } from "@/lib/constants";
import { escapeHtml } from "@/lib/telegram";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function sendWeekendDigest(): Promise<{
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
  const events = digest.weekendEvents;

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0c4a6e">
      <h1 style="font-family:Georgia,serif;color:#0369a1">🌴 Ce week-end à Moorea</h1>
      <p style="color:#64748b;font-size:14px">Votre sélection MooreaNews — ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Pacific/Tahiti" })}</p>

      ${
        events.length > 0
          ? `<ul style="padding-left:18px">${events
              .map(
                (e) =>
                  `<li style="margin:8px 0"><a href="${base}/evenements/${e.slug}"><strong>${escapeHtml(e.title)}</strong></a><br><span style="color:#64748b;font-size:13px">${escapeHtml(e.date)} · ${escapeHtml(e.location)}</span></li>`,
              )
              .join("")}</ul>`
          : `<p>Pas encore d'événements publiés pour ce week-end — consultez l'agenda complet.</p>`
      }

      ${
        digest.openRestaurants.length > 0
          ? `<div style="background:#fff7ed;border-radius:12px;padding:16px;margin:16px 0">
        <h2 style="font-size:16px">🍽 Ouverts ce soir (aperçu)</h2>
        <p>${digest.openRestaurants.map((r) => escapeHtml(r.name)).join(" · ")}</p>
        <p><a href="${base}/restaurants?open=1">Tous les restaurants →</a></p>
      </div>`
          : ""
      }

      <p style="margin-top:24px"><a href="${base}/evenements" style="font-weight:600">Agenda complet →</a></p>
      <p style="font-size:13px;color:#64748b;margin-top:16px"><a href="${base}">MooreaNews</a></p>
    </div>
  `;

  const resend = new Resend(ENV.resendKey);
  let sent = 0;

  for (const row of subscribers) {
    const result = await resend.emails.send({
      from: ENV.resendFrom,
      to: [row.email],
      subject: `🌴 Ce week-end à Moorea — ${events.length} événement${events.length > 1 ? "s" : ""}`,
      html,
      text: `Ce week-end à Moorea — ${events.length} événements. ${base}/evenements`,
    });
    if (!result.error) sent += 1;
  }

  return { sent, skipped: false };
}
