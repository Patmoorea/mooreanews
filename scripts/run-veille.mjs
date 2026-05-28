#!/usr/bin/env node
/**
 * Lance la veille MooreaNews (RSS + Facebook + sites web) depuis votre Mac.
 * Utile si Vercel Hobby ne permet qu’1 cron/jour — planifiez ce script
 * (Automator, cron macOS, plusieurs fois par jour).
 *
 * Prérequis : .env.local avec CRON_SECRET (et optionnellement NEXT_PUBLIC_SITE_URL)
 *
 *   npm run veille
 *   npm run veille -- https://www.mooreanews.com
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

const base = (
  process.argv[2] ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.mooreanews.com"
).replace(/\/$/, "");

const secret = process.env.CRON_SECRET?.trim();
if (!secret) {
  console.error(
    "CRON_SECRET manquant. Ajoutez-le dans .env.local (même valeur que Vercel).",
  );
  process.exit(1);
}

const url = `${base}/api/cron/aggregate?secret=${encodeURIComponent(secret)}`;

console.log(`Veille MooreaNews → ${url.replace(secret, "***")}\n`);

const res = await fetch(url, { method: "GET", cache: "no-store" });
const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error("Réponse non JSON:", text.slice(0, 500));
  process.exit(1);
}

console.log(JSON.stringify(json, null, 2));

if (json?.error === "unauthorized") {
  console.error(
    "\n→ CRON_SECRET incorrect dans .env.local.\n" +
      "  Copiez la MÊME valeur que sur Vercel (Settings → CRON_SECRET).\n" +
      "  Test navigateur : https://www.mooreanews.com/api/cron/aggregate?secret=VOTRE_SECRET\n",
  );
  process.exit(1);
}

if (!res.ok || (json.ok === false && !json.totalInserted)) {
  process.exit(1);
}

console.log(
  `\n✓ ${json.totalInserted ?? 0} nouvel(le)(s) entrée(s), ${json.totalFetched ?? 0} éléments parcourus.`,
);
