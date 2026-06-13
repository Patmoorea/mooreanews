/**
 * Newsletter hebdomadaire — dimanche 18h Tahiti.
 * Récap de la semaine suivante : événements, alertes, annonces, actus, coupures, emploi.
 */

import { readFile } from "fs/promises";
import path from "path";
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

const NEWSLETTER_BANNER_CID = "moorea-newsletter-banner";
const NEWSLETTER_LOGO_CID = "moorea-newsletter-logo";

function newsletterBaseUrl(): string {
  const raw = SITE.url.replace(/\/$/, "");
  if (raw.includes("mooreanews.com") && !raw.includes("www.")) {
    return raw.replace("://mooreanews.com", "://www.mooreanews.com");
  }
  return raw;
}

function newsletterImageSrc(inlineImages: boolean, kind: "banner" | "logo"): string {
  const base = newsletterBaseUrl();
  if (inlineImages) {
    return kind === "banner" ? `cid:${NEWSLETTER_BANNER_CID}` : `cid:${NEWSLETTER_LOGO_CID}`;
  }
  return `${base}${kind === "banner" ? SITE.banner : SITE.logo}`;
}

async function getNewsletterInlineAttachments(): Promise<
  { filename: string; content: Buffer; content_id: string }[]
> {
  const brandDir = path.join(process.cwd(), "public", "brand");
  const [banner, logo] = await Promise.all([
    readFile(path.join(brandDir, "banner.png")),
    readFile(path.join(brandDir, "logo.png")),
  ]);
  return [
    {
      filename: "banner.png",
      content: banner,
      content_id: NEWSLETTER_BANNER_CID,
    },
    {
      filename: "logo.png",
      content: logo,
      content_id: NEWSLETTER_LOGO_CID,
    },
  ];
}

function wrapNewsletterDocument(body: string): string {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<title>MooreaNews — votre semaine à Moorea</title>
</head>
<body style="margin:0;padding:0;background:#e0f2fe;-webkit-text-size-adjust:100%;">
${body}
</body>
</html>`;
}

function formatEventDate(iso: string, time?: string): string {
  const d = new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Tahiti",
  });
  const t = time?.trim().slice(0, 5);
  return t ? `${d} · ${t}` : d;
}

function truncateTitle(title: string, max = 88): string {
  const t = title.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function isNoisyArticle(slug: string, title: string): boolean {
  if (!slug.includes("mooreanews-fb")) return false;
  return /publication ·|updated their status/i.test(title);
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
    .filter(
      (a) =>
        new Date(a.publishedAt).getTime() >= weekStartMs - 7 * 86400000 &&
        !isNoisyArticle(a.slug, a.title),
    )
    .slice(0, 6);

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

function sectionBlock(
  emoji: string,
  title: string,
  inner: string,
  accent: string,
  link?: { href: string; label: string },
): string {
  if (!inner.trim()) return "";
  const cta = link
    ? `<p style="margin:14px 0 0"><a href="${link.href}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:600;font-size:13px;padding:8px 16px;border-radius:999px">${link.label}</a></p>`
    : "";
  return `
    <div style="background:#ffffff;border-radius:16px;padding:18px 20px;margin:18px 0;border:1px solid #e0f2fe;box-shadow:0 4px 14px rgba(12,74,110,0.06);border-left:5px solid ${accent}">
      <h2 style="font-size:17px;margin:0 0 12px;color:#0c4a6e;font-family:Georgia,serif">${emoji} ${title}</h2>
      ${inner}
      ${cta}
    </div>`;
}

function listItems(items: string[], empty: string): string {
  if (!items.length) {
    return `<p style="color:#64748b;margin:0;font-size:14px;line-height:1.5">${empty}</p>`;
  }
  return `<ul style="margin:0;padding-left:0;list-style:none;line-height:1.55">${items.join("")}</ul>`;
}

function newsletterHeader(
  base: string,
  weekLabel: string,
  inlineImages: boolean,
): string {
  const banner = newsletterImageSrc(inlineImages, "banner");
  const logo = newsletterImageSrc(inlineImages, "logo");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#e0f2fe;">
      <tr>
        <td align="center" style="padding:16px 8px 24px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;max-width:640px;width:100%;">
            <tr>
              <td style="padding:0;line-height:0;font-size:0;border-radius:20px 20px 0 0;overflow:hidden;background:#0369a1;">
                <a href="${base}" style="display:block;text-decoration:none;">
                  <img src="${banner}" alt="MooreaNews — L'info de Moorea et de la Polynésie française" width="640" height="auto" style="display:block;width:100%;max-width:640px;height:auto;border:0;outline:none;text-decoration:none;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="background:#fffbeb;padding:28px 24px 8px;text-align:center;border-left:1px solid #e0f2fe;border-right:1px solid #e0f2fe;">
                <img src="${logo}" alt="MooreaNews" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:50%;border:3px solid #ffffff;margin:0 auto 12px;outline:none;" />
                <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0891b2;font-family:Arial,Helvetica,sans-serif;">Ia ora na ! 🌺</p>
                <h1 style="font-family:Georgia,'Times New Roman',serif;color:#0c4a6e;margin:0 0 8px;font-size:26px;line-height:1.2;font-weight:700;">Votre semaine à Moorea</h1>
                <p style="color:#0369a1;font-size:15px;margin:0 0 6px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(weekLabel)}</p>
                <p style="color:#64748b;font-size:14px;margin:0;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
                  Sorties, alertes, actus et bons plans — tout ce qu'il faut pour profiter de l'île la semaine prochaine.
                </p>
              </td>
            </tr>`;
}

function newsletterFooter(base: string): string {
  return `
            <tr>
              <td style="background:#f0f9ff;padding:22px 24px 28px;text-align:center;border:1px solid #e0f2fe;border-top:none;border-radius:0 0 20px 20px;">
                <p style="margin:0 0 12px;font-size:15px;color:#0c4a6e;font-weight:600;font-family:Arial,Helvetica,sans-serif;">E māuruuru — à très vite sur l'île ! 🌴</p>
                <a href="${base}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:999px;font-family:Arial,Helvetica,sans-serif;">Ouvrir MooreaNews →</a>
                <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                  Vous recevez cet email car vous êtes inscrit à la newsletter MooreaNews.<br />
                  <a href="${base}" style="color:#0891b2;text-decoration:underline;">mooreanews.com</a> — l'info locale de Moorea
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function buildWeeklyNewsletterHtml(
  data: WeeklyNewsletterData,
  options?: { inlineImages?: boolean },
): string {
  const base = newsletterBaseUrl();
  const inlineImages = options?.inlineImages ?? false;

  const eventsHtml = listItems(
    data.events.map((e) => {
      const when = formatEventDate(e.date, e.time);
      return `<li style="margin:0 0 12px;padding:12px 14px;background:#fdf4ff;border-radius:12px;border:1px solid #f5d0fe">
        <a href="${base}/evenements/${e.slug}" style="color:#7c3aed;font-weight:700;font-size:15px;text-decoration:none">${escapeHtml(e.title)}</a>
        <p style="margin:4px 0 0;color:#64748b;font-size:13px">📍 ${escapeHtml(e.location)} · ${escapeHtml(when)}</p>
      </li>`;
    }),
    "Pas encore d'événement publié pour cette semaine — jetez un œil à l'agenda, ça bouge vite ! 🎉",
  );

  const alertsHtml =
    data.alerts.length > 0
      ? listItems(
          data.alerts.map(
            (a) =>
              `<li style="margin:0 0 8px;padding:10px 12px;background:${a.urgent ? "#fef2f2" : "#fffbeb"};border-radius:10px;border:1px solid ${a.urgent ? "#fecaca" : "#fde68a"};font-size:14px">${a.urgent ? "🚨 " : "ℹ️ "}${escapeHtml(a.title)}${a.district ? ` <span style="color:#64748b">(${escapeHtml(a.district)})</span>` : ""}</li>`,
          ),
          "",
        )
      : `<p style="color:#64748b;margin:0;font-size:14px">Aucune alerte active — bonne nouvelle ! ☀️</p>`;

  const announcementsHtml = listItems(
    data.announcements.map(
      (a) =>
        `<li style="margin:0 0 8px;padding-left:14px;border-left:3px solid #fb923c;font-size:14px"><a href="${base}/annonces/${a.slug}" style="color:#0c4a6e;font-weight:600">${escapeHtml(truncateTitle(a.title))}</a> <span style="color:#94a3b8;font-size:12px">· ${escapeHtml(a.type)}</span></li>`,
    ),
    "Aucune annonce récente cette semaine.",
  );

  const articlesHtml = listItems(
    data.articles.map(
      (a) =>
        `<li style="margin:0 0 8px;padding-left:14px;border-left:3px solid #38bdf8;font-size:14px"><a href="${base}/actualites/${a.slug}" style="color:#0369a1">${escapeHtml(truncateTitle(a.title))}</a></li>`,
    ),
    "Pas de nouvelle actu majeure — le site se met à jour en continu.",
  );

  const outagesHtml =
    data.outages.length > 0
      ? listItems(
          data.outages.slice(0, 10).map(
            (o) =>
              `<li style="margin:0 0 10px;font-size:14px"><strong style="color:#b45309">${escapeHtml(o.title)}</strong><br><span style="color:#64748b;font-size:13px">${escapeHtml(formatOutageWindow(o.startsAt, o.endsAt))}${o.district ? ` · ${escapeHtml(o.district)}` : ""}</span></li>`,
          ),
          "",
        )
      : `<p style="color:#64748b;margin:0;font-size:14px">Pas de coupure EDT/eau connue pour l'instant. 👍</p>`;

  const jobsHtml = listItems(
    data.jobs.map(
      (j) =>
        `<li style="margin:0 0 8px;font-size:14px"><a href="${escapeHtml(j.url)}" style="color:#0f766e;font-weight:600">${escapeHtml(truncateTitle(j.title, 72))}</a> <span style="color:#94a3b8;font-size:12px">· ${escapeHtml(j.sourceName)}</span></li>`,
    ),
    "Pas de nouvelle offre cette semaine — consultez la page emploi.",
  );

  const sections = `
            <tr>
              <td style="background:#ffffff;padding:8px 20px 12px;border-left:1px solid #e0f2fe;border-right:1px solid #e0f2fe;font-family:Arial,Helvetica,sans-serif;">

      ${sectionBlock("📅", `Agenda (${data.events.length})`, eventsHtml, "#a855f7", { href: `${base}/evenements`, label: "Tout l'agenda →" })}

      ${sectionBlock("⚠️", `Alertes (${data.alerts.length})`, alertsHtml, "#f59e0b", { href: `${base}/alertes`, label: "Voir les alertes →" })}

      ${sectionBlock("📰", "À la une", articlesHtml, "#0ea5e9", { href: `${base}/actualites`, label: "Toutes les actus →" })}

      ${sectionBlock("📣", "Petites annonces", announcementsHtml, "#f97316", { href: `${base}/annonces`, label: "Voir les annonces →" })}

      ${sectionBlock("⚡", "Coupures & eau", outagesHtml, "#eab308", { href: `${base}/coupures`, label: "Détail coupures →" })}

      ${sectionBlock("💼", "Emploi & formation", jobsHtml, "#14b8a6", { href: `${base}/emploi-formation`, label: "Offres Moorea →" })}

              </td>
            </tr>`;

  const body = `${newsletterHeader(base, data.week.label, inlineImages)}${sections}${newsletterFooter(base)}`;
  return wrapNewsletterDocument(body);
}

export function buildWeeklyNewsletterText(data: WeeklyNewsletterData): string {
  const base = newsletterBaseUrl();
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

export async function sendWeeklyNewsletter(options?: {
  /** Envoi test — une ou plusieurs adresses uniquement. */
  testTo?: string[];
}): Promise<{
  sent: number;
  skipped: boolean;
  error?: string;
  week?: string;
  events?: number;
  test?: boolean;
  recipients?: string[];
}> {
  if (!ENV.resendKey) {
    return { sent: 0, skipped: true, error: "Resend non configuré" };
  }

  const testRecipients = options?.testTo?.map((e) => e.trim().toLowerCase()).filter(Boolean);
  const isTest = Boolean(testRecipients?.length);

  let recipients: string[];

  if (isTest) {
    recipients = testRecipients!;
  } else {
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

    recipients = subscribers.map((r) => r.email);
  }

  const data = await gatherWeeklyNewsletterData();
  const html = buildWeeklyNewsletterHtml(data, { inlineImages: true });
  const text = buildWeeklyNewsletterText(data);
  const subjectBase = `🌺 Ia ora na — votre semaine à Moorea (${data.events.length} sortie${data.events.length > 1 ? "s" : ""})`;
  const subject = isTest ? `[TEST] ${subjectBase}` : subjectBase;

  let attachments: Awaited<ReturnType<typeof getNewsletterInlineAttachments>> = [];
  try {
    attachments = await getNewsletterInlineAttachments();
  } catch {
    /* secours : images distantes si fichiers indisponibles */
  }

  const resend = new Resend(ENV.resendKey);
  let sent = 0;

  for (const email of recipients) {
    const result = await resend.emails.send({
      from: ENV.resendFrom,
      to: [email],
      subject,
      html:
        attachments.length > 0
          ? html
          : buildWeeklyNewsletterHtml(data, { inlineImages: false }),
      text: isTest ? `[TEST — envoi manuel]\n\n${text}` : text,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    if (!result.error) sent += 1;
    else if (isTest) {
      return {
        sent,
        skipped: false,
        error: result.error.message,
        test: true,
        recipients,
      };
    }
  }

  return {
    sent,
    skipped: false,
    week: data.week.label,
    events: data.events.length,
    test: isTest,
    recipients: isTest ? recipients : undefined,
  };
}
