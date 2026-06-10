#!/usr/bin/env node
/**
 * Surveillance MooreaNews pour OpenClaw / cron macOS.
 *
 *   npm run watch:site
 *   npm run watch:site -- --fix          # tente veille + sync coupures si APIs seules en panne
 *   npm run watch:site -- https://www.mooreanews.com
 *
 * Prérequis .env.local : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Optionnel : CRON_SECRET (pour --fix et /api/health détaillé)
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const args = process.argv.slice(2);
const fixMode = args.includes("--fix");
const baseArg = args.find((a) => a.startsWith("http"));
const base = (
  baseArg ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.mooreanews.com"
).replace(/\/$/, "");

const PAGES = [
  { path: "/", label: "Accueil" },
  { path: "/alertes", label: "Alertes" },
  { path: "/coupures", label: "Coupures" },
  { path: "/actualites", label: "Actualités" },
];

const STATE_FILE = resolve(__dir, ".openclaw-watch-state.json");
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

function readState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { lastOk: true, lastAlertAt: 0, fingerprint: "" };
  }
}

function writeState(state) {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function probe(path, timeoutMs = 30_000) {
  const url = `${base}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    return { path, status: res.status, ok: res.ok && res.status < 500 };
  } catch (e) {
    return { path, status: 0, ok: false, error: String(e) };
  } finally {
    clearTimeout(timer);
  }
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    console.warn("Telegram non configuré (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)");
    return false;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    console.warn("Telegram échec:", await res.text());
    return false;
  }
  return true;
}

async function tryFixApiOnly(failures) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.log("→ --fix ignoré : CRON_SECRET manquant dans .env.local");
    return [];
  }
  const pageDown = failures.some((f) => PAGES.some((p) => p.path === f.path));
  if (pageDown) {
    console.log("→ Pages en HTTP 500 : correction auto impossible (bug code / déploiement).");
    return ["pages_down"];
  }

  const actions = [];
  const headers = { Authorization: `Bearer ${secret}` };

  console.log("→ Tentative sync coupures…");
  const outages = await fetch(`${base}/api/cron/utility-outages?secret=${encodeURIComponent(secret)}`, {
    headers,
    cache: "no-store",
  });
  if (outages.ok) actions.push("utility-outages");

  console.log("→ Tentative veille RSS/Facebook…");
  const veille = await fetch(`${base}/api/cron/aggregate?secret=${encodeURIComponent(secret)}`, {
    headers,
    cache: "no-store",
  });
  if (veille.ok) actions.push("veille");

  return actions;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  console.log(`\n🔍 MooreaNews watch @ ${base}\n`);

  const results = await Promise.all(PAGES.map((p) => probe(p.path)));
  const failures = results.filter((r) => !r.ok);

  for (const r of results) {
    const label = PAGES.find((p) => p.path === r.path)?.label ?? r.path;
    console.log(r.ok ? "✓" : "✗", label.padEnd(14), r.status || "ERR");
  }

  let healthOk = true;
  try {
    const healthRes = await fetch(`${base}/api/health`, { cache: "no-store" });
    if (healthRes.status === 404) {
      console.log("○", "API /health".padEnd(14), "404 (pas encore déployé)");
    } else {
      const health = await healthRes.json();
      healthOk = healthRes.ok && health?.ok === true;
      console.log(healthOk ? "✓" : "✗", "API /health".padEnd(14), healthRes.status);
    }
  } catch {
    console.log("○", "API /health".padEnd(14), "skip");
  }

  const ok = failures.length === 0 && healthOk;
  const fingerprint = failures.map((f) => `${f.path}:${f.status}`).join("|") || "ok";
  const state = readState();
  const now = Date.now();

  if (ok) {
    if (!state.lastOk) {
      await sendTelegram(
        `✅ <b>MooreaNews</b> — site de nouveau OK\n${escapeHtml(base)}`,
      );
    }
    writeState({ lastOk: true, lastAlertAt: state.lastAlertAt, fingerprint: "ok" });
    console.log("\n✓ Site OK\n");
    process.exit(0);
  }

  console.log("\n✗ Problème détecté\n");

  let fixActions = [];
  if (fixMode) {
    fixActions = await tryFixApiOnly(failures);
    if (fixActions.length > 0 && !fixActions.includes("pages_down")) {
      console.log("\n→ Re-vérification après --fix…");
      const retry = await Promise.all(PAGES.map((p) => probe(p.path)));
      const stillBad = retry.filter((r) => !r.ok);
      if (stillBad.length === 0) {
        await sendTelegram(
          `🔧 <b>MooreaNews</b> — auto-fix OK (${fixActions.join(", ")})\n${escapeHtml(base)}`,
        );
        writeState({ lastOk: true, lastAlertAt: now, fingerprint: "ok" });
        process.exit(0);
      }
    }
  }

  const shouldAlert =
    fingerprint !== state.fingerprint ||
    now - (state.lastAlertAt ?? 0) > ALERT_COOLDOWN_MS;

  if (shouldAlert) {
    const lines = failures.map(
      (f) => `• ${escapeHtml(f.path)} → HTTP ${f.status || "ERR"}`,
    );
    const fixHint = failures.some((f) => PAGES.some((p) => p.path === f.path))
      ? "\n\n⚠️ Page en 500 = bug code. Ouvre Cursor sur moorea-hub ou vérifie Vercel."
      : fixMode
        ? `\n\nAuto-fix tenté : ${fixActions.join(", ") || "rien"}`
        : "\n\nRelance avec --fix pour sync veille/coupures.";

    await sendTelegram(
      `🚨 <b>MooreaNews INDISPONIBLE</b>\n${lines.join("\n")}\n${escapeHtml(base)}${fixHint}`,
    );
    writeState({ lastOk: false, lastAlertAt: now, fingerprint });
  } else {
    console.log("(alerte Telegram en cooldown — déjà signalé)");
    writeState({ ...state, lastOk: false, fingerprint });
  }

  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
