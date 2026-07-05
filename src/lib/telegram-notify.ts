/**
 * Messages Telegram admin — veille, erreurs Meta, activité site, audit contenu.
 */

import type { AggregationResult } from "@/lib/aggregator";
import type { FacebookImportStatus } from "@/lib/facebook-import-status";
import type { FacebookTokenHealth } from "@/lib/facebook-token";
import type { ContentAuditReport } from "@/lib/site-content-audit";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import { getPublicBotTokenStrict, getPublicChatId } from "@/lib/telegram-config";
import {
  filterNotYetOnTelegramChannel,
  markPostedOnTelegramChannel,
} from "@/lib/telegram-channel-dedup";
import { isOptionalVeilleWarning } from "@/lib/feed-errors";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { formatMorningBrief30s } from "@/lib/moorea-brief";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mooreanews.com"
  ).replace(/\/$/, "");
}

export type CreatedArticleNotice = {
  title: string;
  slug: string;
};

const KNOWN_OPTIONAL_ERROR_MARKERS = [
  "CommuneMooreaMaiao",
  "Commune de Moorea",
  "polynesie-1ere",
];

const CRITICAL_ERROR_MARKERS = [
  "logged out",
  "validating access token",
  "OAuthException",
  "Supabase not configured",
  "Token manquant",
];

/** Erreur Meta temporaire — pas un jeton expiré. */
function isTransientGraphApiError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    /http 5\d{2}/i.test(error) ||
    /error_subcode":99/.test(error) ||
    /error_subcode":33/.test(error) ||
    lower.includes("unknown error occurred") ||
    lower.includes("is_transient\":true")
  );
}

export function isCriticalVeilleError(error: string): boolean {
  const lower = error.toLowerCase();
  if (KNOWN_OPTIONAL_ERROR_MARKERS.some((m) => error.includes(m))) {
    return false;
  }
  if (isTransientGraphApiError(error)) {
    return false;
  }
  return CRITICAL_ERROR_MARKERS.some(
    (m) => lower.includes(m.toLowerCase()) || error.includes(m),
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function isMetaTokenError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    lower.includes("logged out") ||
    lower.includes("validating access token") ||
    lower.includes("oauthexception")
  );
}

function isTeItoRauGraphNoise(error: string): boolean {
  return (
    error.includes("Te Ito Rau") ||
    error.includes("100088637945937") ||
    /unsupported get request.*100088637945937/i.test(error)
  );
}

function formatErrors(errors: string[]): string {
  if (errors.length === 0) return "";
  const filtered = errors.filter(
    (e) => !isTeItoRauGraphNoise(e) && !isOptionalVeilleWarning(e),
  );
  if (filtered.length === 0) return "";
  const critical = filtered.filter(isCriticalVeilleError);
  const optional = filtered.filter(
    (e) => !isCriticalVeilleError(e) && !critical.includes(e),
  );

  const lines: string[] = [];
  if (critical.length > 0) {
    lines.push("<b>🔴 Critique</b>");
    for (const e of critical.slice(0, 5)) {
      lines.push(`• ${escapeHtml(truncate(e, 180))}`);
    }
  }
  if (optional.length > 0) {
    lines.push("<b>⚠️ Avertissements</b>");
    for (const e of optional.slice(0, 5)) {
      lines.push(`• ${escapeHtml(truncate(e, 180))}`);
    }
    if (optional.length > 5) {
      lines.push(`… +${optional.length - 5} autre(s)`);
    }
  }
  return lines.join("\n");
}

function formatFacebookImportBlock(
  status: FacebookImportStatus | null | undefined,
): string {
  if (!status) return "";
  const lines = ["\n<b>📘 Facebook MooreaNews → actualités</b>"];
  if (status.ok) {
    lines.push("✅ Derniers imports OK (texte + affiche visibles sur le site)");
  } else {
    lines.push(
      `⚠️ ${status.incompleteArticles} incomplet(s) · ${status.shellArticles} coquille(s) · ${status.fbcdnCoversInDb} fbcdn bloqué(s)`,
    );
    lines.push(`<i>${escapeHtml(status.hint)}</i>`);
    if (status.samples.length > 0) {
      const base = siteUrl();
      for (const s of status.samples.slice(0, 3)) {
        lines.push(
          `• <a href="${base}/actualites/${encodeURIComponent(s.slug)}">${escapeHtml(truncate(s.title, 60))}</a> (${escapeHtml(s.issue)})`,
        );
      }
    }
  }
  return lines.join("\n");
}

function formatSourceScan(bySource: AggregationResult[]): string {
  if (bySource.length === 0) return "";
  const lines = ["\n<b>📡 Recherches effectuées</b>"];
  for (const r of bySource) {
    const parts = [
      `${r.fetched} parcouru(s)`,
      `${r.matched} match`,
      `${r.inserted} inséré(s)`,
    ];
    if ((r.articlesCreated ?? 0) > 0) {
      parts.push(`${r.articlesCreated} article(s)`);
    }
    if ((r.eventsCreated ?? 0) > 0) {
      parts.push(`${r.eventsCreated} evt`);
    }
    if ((r.alertsCreated ?? 0) > 0) {
      parts.push(`${r.alertsCreated} alerte(s)`);
    }
    lines.push(`• ${escapeHtml(r.source)} : ${parts.join(" · ")}`);
  }
  return lines.join("\n");
}

function formatAuditBlock(audit: ContentAuditReport | null | undefined): string {
  if (audit === undefined) {
    return "";
  }
  if (!audit) {
    return "\n<b>🔍 Audit site</b> : indisponible (Supabase admin absent)";
  }

  const base = siteUrl();
  const { findings, totals } = audit;

  if (findings.length === 0) {
    return (
      `\n<b>🔍 Audit site</b> : ✅ rien de suspect\n` +
      `<i>${totals.articles} articles · ${totals.events} événements · ${totals.announcements} annonces · ${totals.external} veille externe</i>`
    );
  }

  const critical = findings.filter((f) => f.severity === "critical");
  const lines = [
    `\n<b>🔍 Audit site — ${findings.length} suspect(s)</b>`,
    critical.length > 0
      ? `🔴 ${critical.length} critique(s) · ⚠️ ${findings.length - critical.length} avertissement(s)`
      : null,
  ].filter(Boolean) as string[];

  for (const f of findings.slice(0, 10)) {
    const icon = f.severity === "critical" ? "🔴" : "⚠️";
    lines.push(
      `${icon} <a href="${base}${f.adminPath}">${escapeHtml(truncate(f.title, 55))}</a>`,
    );
    lines.push(`   <i>${escapeHtml(truncate(f.reason, 70))}</i>`);
  }
  if (findings.length > 10) {
    lines.push(`… +${findings.length - 10} autre(s) → ${base}/admin`);
  }

  return lines.join("\n");
}

/** Envoyer même si rien de nouveau (désactiver avec TELEGRAM_VEILLE_SILENT=true). */
function shouldNotifyVeille(input: {
  totalInserted: number;
  articlesCreated: number;
  eventsCreated: number;
  announcementsCreated: number;
  alertsCreated: number;
  expiredAlerts: number;
  errors: string[];
  audit?: ContentAuditReport | null;
}): boolean {
  if (process.env.TELEGRAM_VEILLE_SILENT === "true") {
    return (
      input.totalInserted > 0 ||
      input.articlesCreated > 0 ||
      input.eventsCreated > 0 ||
      input.announcementsCreated > 0 ||
      input.alertsCreated > 0 ||
      input.expiredAlerts > 0 ||
      input.errors.some(isCriticalVeilleError) ||
      (input.audit?.findings.length ?? 0) > 0
    );
  }
  return true;
}

export async function notifyVeilleReport(input: {
  durationMs: number;
  totalFetched: number;
  totalInserted: number;
  articlesCreated: number;
  articlesSkipped: number;
  eventsCreated: number;
  announcementsCreated: number;
  alertsCreated?: number;
  expiredAlerts?: number;
  createdAlertTitles?: string[];
  errors: string[];
  bySource: AggregationResult[];
  createdArticles?: CreatedArticleNotice[];
  repairedArticles?: CreatedArticleNotice[];
  articlesRepaired?: number;
  createdEvents?: { title: string; id: string; date: string }[];
  audit?: ContentAuditReport | null;
  facebookHealth?: FacebookTokenHealth | null;
  facebookImportStatus?: FacebookImportStatus | null;
  facebookPurgeDeleted?: number;
  facebookCleanup?: { unpublished: number; deleted: number; duplicatesRemoved?: number };
  externalCleanup?: { hidden: number; titles: string[] };
  expiredEvents?: { unpublished: number; titles: string[] };
  expiredAnnouncements?: number;
  headerNote?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const alertsCreated = input.alertsCreated ?? 0;
  const expiredAlerts = input.expiredAlerts ?? 0;

  if (
    !shouldNotifyVeille({
      totalInserted: input.totalInserted,
      articlesCreated: input.articlesCreated,
      eventsCreated: input.eventsCreated,
      announcementsCreated: input.announcementsCreated,
      alertsCreated,
      expiredAlerts,
      errors: input.errors,
      audit: input.audit,
    })
  ) {
    return { sent: false, reason: "silent_mode" };
  }

  const hasCritical = input.errors.some(isCriticalVeilleError);
  const hasMetaToken = input.errors.some(isMetaTokenError);
  const hasSuspect = (input.audit?.findings.length ?? 0) > 0;

  const statusEmoji = hasCritical
    ? "🔴"
    : hasSuspect
      ? "⚠️"
      : input.errors.length > 0
        ? "⚠️"
        : "✅";

  const lines = [
    `${statusEmoji} <b>Veille MooreaNews</b>`,
  ];
  if (input.headerNote?.trim()) {
    lines.push(escapeHtml(input.headerNote.trim()));
  }
  if (input.headerNote?.includes("finish")) {
    lines.push(
      `⏱ ${(input.durationMs / 1000).toFixed(1)} s · étape finish (audit + nettoyage)`,
    );
  } else {
    lines.push(
      `⏱ ${(input.durationMs / 1000).toFixed(1)} s · ${input.totalFetched} parcouru(s) · ${input.totalInserted} inséré(s)`,
    );
  }

  lines.push(formatSourceScan(input.bySource));

  const creations: string[] = [];
  if (input.articlesCreated > 0) {
    creations.push(`${input.articlesCreated} actualité(s)`);
  }
  if (input.eventsCreated > 0) {
    creations.push(`${input.eventsCreated} événement(s)`);
  }
  if (input.announcementsCreated > 0) {
    creations.push(`${input.announcementsCreated} annonce(s)`);
  }
  if (alertsCreated > 0) creations.push(`${alertsCreated} alerte(s) auto`);
  if (expiredAlerts > 0) {
    creations.push(`${expiredAlerts} alerte(s) expirée(s)`);
  }

  if ((input.facebookPurgeDeleted ?? 0) > 0) {
    lines.push(
      `\n🧹 <b>${input.facebookPurgeDeleted}</b> import(s) Facebook vide(s) ou obsolète(s) supprimé(s)`,
    );
  }

  if (creations.length > 0) {
    lines.push(`\n<b>📥 Résultat</b> : ${creations.join(" · ")}`);
  } else if (input.articlesSkipped > 0) {
    lines.push(`\n↩️ ${input.articlesSkipped} import(s) déjà connu(s)`);
  } else {
    lines.push("\n<i>Aucune nouvelle publication créée ce passage.</i>");
  }

  if (input.createdEvents && input.createdEvents.length > 0) {
    lines.push("\n<b>📅 Événements créés :</b>");
    const base = siteUrl();
    for (const e of input.createdEvents.slice(0, 6)) {
      lines.push(
        `• <a href="${base}/evenements/${encodeURIComponent(e.id)}">${escapeHtml(truncate(e.title, 80))}</a> (${e.date})`,
      );
    }
  }

  if (input.articlesRepaired && input.articlesRepaired > 0) {
    lines.push(`\n🔧 <b>${input.articlesRepaired}</b> publication(s) réparée(s)`);
  }

  if (input.repairedArticles && input.repairedArticles.length > 0) {
    lines.push("\n<b>🔧 Publications réparées :</b>");
    const base = siteUrl();
    for (const a of input.repairedArticles.slice(0, 6)) {
      lines.push(
        `• <a href="${base}/actualites/${encodeURIComponent(a.slug)}">${escapeHtml(truncate(a.title, 80))}</a>`,
      );
    }
    if (input.repairedArticles.length > 6) {
      lines.push(`… +${input.repairedArticles.length - 6} autre(s)`);
    }
  }

  if (input.createdArticles && input.createdArticles.length > 0) {
    lines.push("\n<b>📝 Publications créées :</b>");
    const base = siteUrl();
    for (const a of input.createdArticles.slice(0, 8)) {
      lines.push(
        `• <a href="${base}/actualites/${encodeURIComponent(a.slug)}">${escapeHtml(truncate(a.title, 80))}</a>`,
      );
    }
    if (input.createdArticles.length > 8) {
      lines.push(`… +${input.createdArticles.length - 8} autre(s)`);
    }
  }

  if (input.createdAlertTitles && input.createdAlertTitles.length > 0) {
    lines.push("\n<b>🚨 Alertes mises en ligne :</b>");
    for (const t of input.createdAlertTitles.slice(0, 5)) {
      lines.push(`• ${escapeHtml(truncate(t, 80))}`);
    }
  }

  lines.push(formatAuditBlock(input.audit));
  lines.push(formatFacebookImportBlock(input.facebookImportStatus));

  if (
    input.facebookCleanup &&
    (input.facebookCleanup.unpublished > 0 ||
      input.facebookCleanup.deleted > 0 ||
      (input.facebookCleanup.duplicatesRemoved ?? 0) > 0)
  ) {
    lines.push(
      `\n🧹 <b>Nettoyage Facebook</b> : ${input.facebookCleanup.unpublished} dépubliée(s), ${input.facebookCleanup.deleted} supprimée(s) (coquilles vides)${input.facebookCleanup.duplicatesRemoved ? `, ${input.facebookCleanup.duplicatesRemoved} doublon(s)` : ""}`,
    );
  }

  if (input.externalCleanup && input.externalCleanup.hidden > 0) {
    lines.push(
      `\n🧹 <b>Veille RSS</b> : ${input.externalCleanup.hidden} entrée(s) obsolète(s) masquée(s)`,
    );
    for (const t of input.externalCleanup.titles.slice(0, 3)) {
      lines.push(`• ${escapeHtml(truncate(t, 70))}`);
    }
  }

  if (input.expiredEvents && input.expiredEvents.unpublished > 0) {
    lines.push(
      `\n🧹 <b>Événements passés</b> : ${input.expiredEvents.unpublished} dépublié(s)`,
    );
    for (const t of input.expiredEvents.titles.slice(0, 3)) {
      lines.push(`• ${escapeHtml(truncate(t, 70))}`);
    }
  }

  if ((input.expiredAnnouncements ?? 0) > 0) {
    lines.push(
      `\n🧹 <b>Annonces expirées</b> : ${input.expiredAnnouncements} dépubliée(s)`,
    );
  }

  if (input.facebookHealth) {
    const h = input.facebookHealth;
    if (!h.pageTokenValid && !h.userTokenValid) {
      lines.push(
        "\n🔑 <b>Facebook</b> : jetons invalides sur Vercel — refaire /me/accounts → FACEBOOK_PAGE_ACCESS_TOKEN",
      );
    } else if (!h.pageTokenValid && h.pageTokenPresent) {
      lines.push(
        "\n🔑 <b>Facebook</b> : FACEBOOK_PAGE_ACCESS_TOKEN invalide — regénérez le jeton page MooreaNews (350029589936) sur Vercel puis Redeploy",
      );
    } else if (h.daysUntilUserExpiry != null && h.daysUntilUserExpiry < 14) {
      lines.push(
        `\n🔑 <b>Facebook</b> : jeton utilisateur expire dans ~${h.daysUntilUserExpiry} j — renouveler (APP_ID + APP_SECRET)`,
      );
    } else if (h.refreshedThisRun) {
      lines.push(
        "\n🔑 <b>Facebook</b> : jeton utilisateur renouvelé en mémoire — mettre à jour Vercel",
      );
    }
  }

  if (hasMetaToken) {
    lines.push(
      "\n🔑 <b>Jeton Meta</b> : invalide ou expiré → regénérez le token page puis Vercel.",
    );
  }

  const errBlock = formatErrors(input.errors);
  if (errBlock) {
    lines.push(`\n${errBlock}`);
  }

  const message = truncate(lines.join("\n"), 3900);
  const result = await sendTelegramNotification(message);

  return result.ok
    ? { sent: true }
    : { sent: false, reason: result.error ?? "telegram_failed" };
}

export async function notifyAccountSignup(input: {
  email: string;
  fullName?: string;
}): Promise<void> {
  const name = input.fullName?.trim();
  await sendTelegramNotification(
    [
      "👤 <b>Nouvelle inscription compte</b>",
      name ? `Nom : ${escapeHtml(name)}` : null,
      `Email : ${escapeHtml(input.email)}`,
      "<i>En attente de confirmation email</i>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export async function notifyAccountActivated(input: {
  email: string;
}): Promise<void> {
  await sendTelegramNotification(
    `✅ <b>Compte activé</b>\n${escapeHtml(input.email)}\nAccès admin possible.`,
  );
}

export async function notifyContentAuditOnly(
  audit: ContentAuditReport,
): Promise<{ sent: boolean; reason?: string }> {
  if (audit.findings.length === 0) {
    const r = await sendTelegramNotification(
      `✅ <b>Audit MooreaNews</b>\nAucun contenu suspect.\n<i>${audit.totals.articles} articles · ${audit.totals.events} événements vérifiés.</i>`,
    );
    return r.ok ? { sent: true } : { sent: false, reason: r.error };
  }

  const base = siteUrl();
  const lines = [
    `⚠️ <b>Audit MooreaNews — ${audit.findings.length} suspect(s)</b>`,
    formatAuditBlock(audit),
    `\n→ <a href="${base}/admin">Admin</a>`,
  ];
  const r = await sendTelegramNotification(lines.join("\n"));
  return r.ok ? { sent: true } : { sent: false, reason: r.error };
}

/** Posts nouveaux articles sur le canal public Telegram (si configuré). */
export async function notifyPublicNewArticles(
  articles: CreatedArticleNotice[],
): Promise<{
  sent: number;
  failed: number;
  reason?: string;
  errors: string[];
}> {
  if (process.env.TELEGRAM_PUBLIC_ARTICLE_POSTS === "false") {
    return { sent: 0, failed: 0, reason: "disabled", errors: [] };
  }
  const publicChat = getPublicChatId();
  const token = getPublicBotTokenStrict();
  if (!token) {
    return {
      sent: 0,
      failed: 0,
      reason: "TELEGRAM_PUBLIC_BOT_TOKEN manquant sur Vercel",
      errors: [],
    };
  }
  if (!publicChat) {
    return {
      sent: 0,
      failed: 0,
      reason: "TELEGRAM_PUBLIC_CHAT_ID manquant sur Vercel",
      errors: [],
    };
  }
  if (articles.length === 0) {
    return { sent: 0, failed: 0, reason: "no_articles", errors: [] };
  }

  const toPost = await filterNotYetOnTelegramChannel(articles);
  if (toPost.length === 0) {
    return { sent: 0, failed: 0, reason: "already_posted", errors: [] };
  }

  const base = siteUrl();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const a of toPost.slice(0, 5)) {
    const html = [
      `<b>📰 MooreaNews</b>`,
      escapeHtml(truncate(a.title, 120)),
      `<a href="${base}/actualites/${encodeURIComponent(a.slug)}">Lire sur le site →</a>`,
    ].join("\n");

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: publicChat,
            text: html,
            parse_mode: "HTML",
            disable_web_page_preview: false,
          }),
        },
      );
      const json = (await res.json()) as {
        ok?: boolean;
        description?: string;
      };
      if (res.ok && json.ok) {
        sent += 1;
        await markPostedOnTelegramChannel(a.slug);
      } else {
        failed += 1;
        const msg = json.description ?? `HTTP ${res.status}`;
        errors.push(msg);
        console.error("[telegram channel]", msg, a.slug);
      }
    } catch (e) {
      failed += 1;
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      console.error("[telegram channel]", msg, a.slug);
    }
  }

  return { sent, failed, errors: errors.slice(0, 5) };
}

/** Message test canal public — diagnostic config. */
function explainChannelTelegramError(description: string): string | undefined {
  const d = description.toLowerCase();
  if (d.includes("can't send messages to the bot")) {
    return "TELEGRAM_PUBLIC_CHAT_ID = ID du bot (incorrect). Mettez l'ID du CANAL @MooreaNews (commence par -100…), pas le chat du bot.";
  }
  if (d.includes("chat not found")) {
    return "Canal introuvable — vérifiez TELEGRAM_PUBLIC_CHAT_ID ou ajoutez @MooreanewsPublic_bot au canal.";
  }
  if (d.includes("not a member") || d.includes("administrator rights")) {
    return "Ajoutez @MooreanewsPublic_bot comme administrateur du canal avec droit « Publier des messages ».";
  }
  return undefined;
}

export async function sendTestPublicChannelPost(): Promise<{
  ok: boolean;
  reason?: string;
  telegramError?: string;
  hint?: string;
}> {
  const token = getPublicBotTokenStrict();
  const chatId = getPublicChatId();
  if (!token) {
    return { ok: false, reason: "TELEGRAM_PUBLIC_BOT_TOKEN manquant" };
  }
  if (!chatId) {
    return { ok: false, reason: "TELEGRAM_PUBLIC_CHAT_ID manquant" };
  }

  const base = siteUrl();
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Test canal MooreaNews — ${new Date().toISOString()}\n<a href="${base}/">mooreanews.com</a>`,
          parse_mode: "HTML",
        }),
      },
    );
    const json = (await res.json()) as {
      ok?: boolean;
      description?: string;
    };
    if (res.ok && json.ok) return { ok: true };
    const telegramError = json.description ?? `HTTP ${res.status}`;
    return {
      ok: false,
      reason: "telegram_api_error",
      telegramError,
      hint: explainChannelTelegramError(telegramError),
    };
  } catch (e) {
    return {
      ok: false,
      reason: "fetch_failed",
      telegramError: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Digest public Telegram — 1 message matin max (canal public si configuré). */
export async function sendPublicMooreaBrief(): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const publicChat = getPublicChatId();
  const token = getPublicBotTokenStrict();
  if (!token || !publicChat) {
    return {
      sent: false,
      reason: "Canal public non configuré (TELEGRAM_PUBLIC_CHAT_ID + TELEGRAM_PUBLIC_BOT_TOKEN)",
    };
  }

  const digest = await getMooreaDuJour();
  const brief = formatMorningBrief30s(digest);
  const base = siteUrl();

  let bodyLine = escapeHtml(brief.body);
  if (brief.eventSlug && brief.eventLabel) {
    const badPart = `📅 ${escapeHtml(brief.eventLabel)}`;
    const linked = `📅 <a href="${base}/evenements/${encodeURIComponent(brief.eventSlug)}">${escapeHtml(brief.eventLabel)}</a>`;
    bodyLine = bodyLine.replace(badPart, linked);
  }

  const html = [
    `<b>🌺 Moorea en 30 secondes</b>`,
    bodyLine,
    `\n<a href="${base}/">Ouvrir MooreaNews →</a>`,
  ].join("\n");

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: publicChat,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
    if (!res.ok) {
      return { sent: false, reason: await res.text() };
    }
    return { sent: true };
  } catch (e) {
    return {
      sent: false,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Alertes admin quand import Facebook échoue (affiches fbcdn, coquilles…). */
export async function notifyFacebookImportReport(input: {
  durationMs: number;
  articlesCreated: number;
  articlesRepaired: number;
  articlesSkipped: number;
  coversPersisted: number;
  coversFailed: number;
  fbcdnRemaining: number;
  errors: string[];
  warnings: string[];
}): Promise<{ sent: boolean; reason?: string }> {
  const hasIssue =
    input.errors.length > 0 ||
    input.warnings.length > 0 ||
    input.coversFailed > 0 ||
    input.fbcdnRemaining > 0;

  if (!hasIssue && input.articlesRepaired === 0 && input.articlesCreated === 0) {
    return { sent: false, reason: "nothing_to_report" };
  }

  const critical = input.errors.some(isCriticalVeilleError);
  const emoji = critical ? "🔴" : hasIssue ? "⚠️" : "✅";

  const lines = [
    `${emoji} <b>Import Facebook MooreaNews</b>`,
    `⏱ ${(input.durationMs / 1000).toFixed(1)} s`,
    `📥 ${input.articlesCreated} créé(s) · 🔧 ${input.articlesRepaired} réparé(s) · ⏭ ${input.articlesSkipped} ignoré(s)`,
    `🖼 ${input.coversPersisted} affiche(s) → Supabase · ❌ ${input.coversFailed} échec(s)`,
  ];

  if (input.fbcdnRemaining > 0) {
    lines.push(
      `\n🚫 <b>${input.fbcdnRemaining}</b> affiche(s) fbcdn encore en base (invisibles sur le site)`,
    );
    lines.push(
      `<i>Relancez /api/cron/facebook ou consultez /api/watch/facebook-import-status</i>`,
    );
  }

  if (input.warnings.length > 0) {
    lines.push("\n<b>Avertissements</b>");
    for (const w of input.warnings.slice(0, 6)) {
      lines.push(`• ${escapeHtml(w.slice(0, 200))}`);
    }
    if (input.warnings.length > 6) {
      lines.push(`… +${input.warnings.length - 6} autre(s)`);
    }
  }

  if (input.errors.length > 0) {
    lines.push("\n<b>Erreurs</b>");
    for (const e of input.errors.slice(0, 4)) {
      lines.push(`• ${escapeHtml(e.slice(0, 200))}`);
    }
  }

  const sent = await sendTelegramNotification(lines.join("\n"));
  return sent.ok
    ? { sent: true }
    : { sent: false, reason: sent.error ?? "telegram_failed" };
}
