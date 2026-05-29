/**
 * Messages Telegram admin — veille, erreurs Meta, activité site.
 */

import type { AggregationResult } from "@/lib/aggregator";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";

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
  "radio1-tahiti",
  "mairie-moorea.pf",
  "polynesie-1ere",
];

const CRITICAL_ERROR_MARKERS = [
  "logged out",
  "validating access token",
  "OAuthException",
  "Supabase not configured",
  "Graph API MooreaNews",
  "Token manquant",
  "facebook-pages: Error: Graph API MooreaNews",
];

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function isCriticalVeilleError(error: string): boolean {
  const lower = error.toLowerCase();
  if (KNOWN_OPTIONAL_ERROR_MARKERS.some((m) => error.includes(m))) {
    return false;
  }
  return CRITICAL_ERROR_MARKERS.some(
    (m) => lower.includes(m.toLowerCase()) || error.includes(m),
  );
}

export function isMetaTokenError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    lower.includes("logged out") ||
    lower.includes("validating access token") ||
    lower.includes("oauthexception")
  );
}

function formatErrors(errors: string[]): string {
  if (errors.length === 0) return "";
  const critical = errors.filter(isCriticalVeilleError);
  const optional = errors.filter(
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

export async function notifyVeilleReport(input: {
  durationMs: number;
  totalFetched: number;
  totalInserted: number;
  articlesCreated: number;
  articlesSkipped: number;
  errors: string[];
  bySource: AggregationResult[];
  createdArticles?: CreatedArticleNotice[];
}): Promise<void> {
  const fbPages = input.bySource.find((r) => r.source === "facebook-pages");
  const fbFetched = fbPages?.fetched ?? 0;
  const hasCritical = input.errors.some(isCriticalVeilleError);
  const hasMetaToken = input.errors.some(isMetaTokenError);

  const statusEmoji = hasCritical ? "🔴" : input.errors.length > 0 ? "⚠️" : "✅";

  const lines = [
    `${statusEmoji} <b>Veille MooreaNews</b>`,
    `⏱ ${(input.durationMs / 1000).toFixed(1)} s · ${input.totalInserted} entrée(s) · ${input.totalFetched} parcouru(s)`,
  ];

  if (fbFetched > 0) {
    lines.push(
      `\n📘 <b>Facebook MooreaNews</b> : ${fbFetched} post(s)`,
    );
    if (input.articlesCreated > 0) {
      lines.push(`📝 ${input.articlesCreated} nouvel(le)(s) article(s) site`);
    } else if ((input.articlesSkipped ?? 0) > 0) {
      lines.push(`↩️ ${input.articlesSkipped} déjà importé(s)`);
    }
  }

  if (input.createdArticles && input.createdArticles.length > 0) {
    lines.push("\n<b>Publications créées :</b>");
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

  const sourcesWithInserts = input.bySource.filter((r) => r.inserted > 0);
  if (sourcesWithInserts.length > 0) {
    lines.push("\n<b>Sources :</b>");
    for (const r of sourcesWithInserts) {
      lines.push(`• ${escapeHtml(r.source)} : ${r.inserted}`);
    }
  }

  if (hasMetaToken) {
    lines.push(
      "\n🔑 <b>Jeton Meta</b> : invalide ou expiré → regénérez <code>350029589936?fields=access_token</code> puis Vercel.",
    );
  }

  const errBlock = formatErrors(input.errors);
  if (errBlock) {
    lines.push(`\n${errBlock}`);
  }

  await sendTelegramNotification(lines.join("\n"));
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
