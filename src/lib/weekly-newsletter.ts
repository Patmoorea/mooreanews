/**
 * Newsletter hebdomadaire — dimanche 18h Tahiti.
 * Récap de la semaine suivante : événements, alertes, annonces, actus, coupures, emploi.
 */

import { Resend } from "resend";
import { ENV, SITE } from "@/lib/constants";
import { escapeHtml } from "@/lib/telegram";
import { expirePastAlerts } from "@/lib/alert-schedule";
import {
  getAnnouncements,
  getArticles,
  getEventsBetween,
} from "@/lib/content";
import { getRecentMooreaJobOffers } from "@/lib/employment-listings";
import { getNextWeekRange } from "@/lib/week-ahead-range";
import { dbListActiveAlerts } from "@/lib/supabase/queries";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  formatOutageWindow,
  type UtilityOutage,
} from "@/lib/utility-outages-shared";
import { getUtilityOutages } from "@/lib/utility-outages";

export type WeeklyNewsletterData = {
  week: ReturnType<typeof getNextWeekRange>;
  events: Awaited<ReturnType<typeof getEventsBetween>>;
  alerts: { id: string; title: string; urgent: boolean; district: string | null }[];
  announcements: { slug: string; title: string; type: string }[];
  articles: { slug: string; title: string; category: string }[];
  outages: UtilityOutage[];
  jobs: Awaited<ReturnType<typeof getRecentMooreaJobOffers>>;
};

function formatEventDate(iso: string, time?: string): string {
  const d = new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Tahiti",
  });
  return time ? `${d} · ${time}` : d;
}

function outageOverlapsWeek(
  outage: UtilityOutage,
  weekStart: string,
  weekEnd: string,
): boolean {
  const start = outage.startsAt.slice(0, 10);
  const end = outage.endsAt.slice(0, 10);
  return start <= weekEnd && end >= weekStart;
}

export async function gatherWeeklyNewsletterData(): Promise<WeeklyNewsletterData> {
  await expirePastAlerts().catch(() => 0);
  const week = getNextWeekRange();

  const [events, alertRows, announcements, articles, outagesResult, jobs] =
    await Promise.all([
      getEventsBetween(week.start, week.end),
      dbListActiveAlerts(),
      getAnnouncements(),
      getArticles(),
      getUtilityOutages(),
      getRecentMooreaJobOffers(8, 14),
    ]);

  const weekStartMs = new Date(`${week.start}T00:00:00`).getTime();
  const recentArticles = articles
    .filter((a) => new Date(a.publishedAt).getTime() >= weekStartMs - 7 * 86400000)
    .slice(0, 8);

  const recentAnnouncements = announcements.slice(0, 8);

  const alerts = (alertRows ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    urgent: a.urgent,
    district: a.district,
  }));

  const outages = outagesResult.all.filter((o) =>
    outageOverlapsWeek(o, week.start, week.end),
  );

  return {
    week,
    events,
    alerts,
    announcements: recentAnnouncements.map((a) => ({
      slug: a.slug,
      title: a.title,
      type: a.type,
    })),
    articles: recentArticles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
    })),
    outages,
    jobs,
  };
}

function sectionBlock(title: string, inner: string): string {
  if (!inner.trim()) return "";
  return `
    <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:20px 0;border:1px solid #e2e8f0">
      <h2 style="font-size:17px;margin:0 0 12px;color:#0369a1">${title}</h2>
      ${inner}
    </div>`;
}

function listItems(items: string[]): string {
  if (!items.length) {
    return `<p style="color:#64748b;margin:0">Rien de prévu pour le moment — consultez le site pour les mises à jour.</p>`;
  }
  return `<ul style="margin:0;padding-left:18px;line-height:1.5">${items.join("")}</ul>`;
}

export function buildWeeklyNewsletterHtml(data: WeeklyNewsletterData): string {
  const base = SITE.url.replace(/\/$/, "");

  const eventsHtml = listItems(
    data.events.map((e) => {
      const when = formatEventDate(e.date, e.time);
      return `<li style="margin:8px 0"><a href="${base}/evenements/${e.slug}" style="color:#0c4a6e;font-weight:600">${escapeHtml(e.title)}</a><br><span style="color:#64748b;font-size:13px">${escapeHtml(when)} · ${escapeHtml(e.location)}</span></li>`;
    }),
  );

  const alertsHtml =
    data.alerts.length > 0
      ? listItems(
          data.alerts.map(
            (a) =>
              `<li style="margin:6px 0">${a.urgent ? "🚨 " : ""}${escapeHtml(a.title)}${a.district ? ` <span style="color:#64748b">(${escapeHtml(a.district)})</span>` : ""}</li>`,
          ),
        )
      : `<p style="color:#64748b;margin:0">Aucune alerte active en ce moment.</p>`;

  const announcementsHtml = listItems(
    data.announcements.map(
      (a) =>
        `<li style="margin:6px 0"><a href="${base}/annonces/${a.slug}">${escapeHtml(a.title)}</a> <span style="color:#64748b;font-size:12px">(${escapeHtml(a.type)})</span></li>`,
    ),
  );

  const articlesHtml = listItems(
    data.articles.map(
      (a) =>
        `<li style="margin:6px 0"><a href="${base}/actualites/${a.slug}">${escapeHtml(a.title)}</a></li>`,
    ),
  );

  const outagesHtml =
    data.outages.length > 0
      ? listItems(
          data.outages.slice(0, 10).map(
            (o) =>
              `<li style="margin:6px 0"><strong>${escapeHtml(o.title)}</strong><br><span style="color:#64748b;font-size:13px">${escapeHtml(formatOutageWindow(o.startsAt, o.endsAt))}${o.district ? ` · ${escapeHtml(o.district)}` : ""}</span></li>`,
          ),
        )
      : `<p style="color:#64748b;margin:0">Pas de coupure EDT/eau programmée connue pour cette semaine.</p>`;

  const jobsHtml = listItems(
    data.jobs.map(
      (j) =>
        `<li style="margin:6px 0"><a href="${escapeHtml(j.url)}">${escapeHtml(j.title)}</a> <span style="color:#64748b;font-size:12px">(${escapeHtml(j.sourceName)})</span></li>`,
    ),
  );

  return `
    <div style="font-family:Inter,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0c4a6e">
      <h1 style="font-family:Georgia,serif;color:#0369a1;margin:0 0 8px">🌺 MooreaNews — Semaine à venir</h1>
      <p style="color:#64748b;font-size:14px;margin:0 0 4px">Votre récap ${escapeHtml(data.week.label)}</p>
      <p style="color:#64748b;font-size:13px;margin:0">Agenda, alertes, actus et infos pratiques pour préparer votre semaine à Moorea.</p>

      ${sectionBlock(`📅 Événements (${data.events.length})`, eventsHtml + `<p style="margin:12px 0 0"><a href="${base}/evenements">Agenda complet →</a></p>`)}

      ${sectionBlock(`⚠️ Alertes en cours (${data.alerts.length})`, alertsHtml + `<p style="margin:12px 0 0"><a href="${base}/alertes">Toutes les alertes →</a></p>`)}

      ${sectionBlock("📰 Actualités récentes", articlesHtml + `<p style="margin:12px 0 0"><a href="${base}/actualites">Toutes les actus →</a></p>`)}

      ${sectionBlock("📣 Annonces", announcementsHtml + `<p style="margin:12px 0 0"><a href="${base}/annonces">Petites annonces →</a></p>`)}

      ${sectionBlock("⚡ Coupures EDT & eau", outagesHtml + `<p style="margin:12px 0 0"><a href="${base}/coupures">Détail coupures →</a></p>`)}

      ${sectionBlock("💼 Emploi & formation", jobsHtml + `<p style="margin:12px 0 0"><a href="${base}/emploi-formation">Offres Moorea →</a></p>`)}

      <p style="margin-top:28px;font-size:13px;color:#64748b;line-height:1.6">
        Vous recevez cet email car vous êtes inscrit à la newsletter <a href="${base}">MooreaNews</a>.<br>
        L'info locale de Moorea — événements, alertes, ferries et météo sur <a href="${base}">mooreanews.com</a>
      </p>
    </div>
  `;
}

export function buildWeeklyNewsletterText(data: WeeklyNewsletterData): string {
  const base = SITE.url.replace(/\/$/, "");
  const lines = [
    `MooreaNews — Semaine ${data.week.label}`,
    "",
    `Événements (${data.events.length})`,
    ...data.events.map((e) => `- ${e.title} (${e.date}) ${base}/evenements/${e.slug}`),
    "",
    `Alertes (${data.alerts.length})`,
    ...data.alerts.map((a) => `- ${a.title}`),
    "",
    `${base}`,
  ];
  return lines.join("\n");
}

export async function sendWeeklyNewsletter(): Promise<{
  sent: number;
  skipped: boolean;
  error?: string;
  week?: string;
  events?: number;
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

  const data = await gatherWeeklyNewsletterData();
  const html = buildWeeklyNewsletterHtml(data);
  const text = buildWeeklyNewsletterText(data);
  const subject = `🌺 Moorea — votre semaine (${data.events.length} événement${data.events.length > 1 ? "s" : ""})`;

  const resend = new Resend(ENV.resendKey);
  let sent = 0;

  for (const row of subscribers) {
    const result = await resend.emails.send({
      from: ENV.resendFrom,
      to: [row.email],
      subject,
      html,
      text,
    });
    if (!result.error) sent += 1;
  }

  return {
    sent,
    skipped: false,
    week: data.week.label,
    events: data.events.length,
  };
}
