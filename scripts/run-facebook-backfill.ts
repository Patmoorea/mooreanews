#!/usr/bin/env npx tsx
/**
 * Rattrapage immédiat du fil Facebook MooreaNews (+ pages liées).
 * Utilise .env.local (Supabase + tokens Meta).
 *
 *   npm run facebook-backfill
 *   FACEBOOK_IMPORT_MAX_AGE_DAYS=90 npm run facebook-backfill
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

if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
  console.error("SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local");
  process.exit(1);
}

const hasPageToken = Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim());
const hasUserToken = Boolean(process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim());

if (!hasPageToken && !hasUserToken) {
  console.error(
    "Jeton Meta manquant dans .env.local.\n\n" +
      "Ajoutez au moins l’un des deux (copie depuis Vercel → Settings → Environment Variables) :\n" +
      "  • FACEBOOK_USER_ACCESS_TOKEN  (recommandé — récupère MooreaNews via /me/accounts)\n" +
      "  • FACEBOOK_PAGE_ACCESS_TOKEN  (jeton page MooreaNews, id 350029589936)\n\n" +
      "Optionnel pour renouvellement auto du jeton user :\n" +
      "  FACEBOOK_APP_ID, FACEBOOK_APP_SECRET\n",
  );
  process.exit(1);
}

process.env.FACEBOOK_IMPORT_AS_ARTICLES ??= "true";
process.env.FACEBOOK_ARTICLES_PUBLISHED ??= "true";
process.env.FACEBOOK_EVENTS_PUBLISHED ??= "true";

async function main() {
  const { aggregateFacebookPagesGraph } = await import(
    "../src/lib/facebook-watch"
  );

  console.log(
    `Rattrapage Facebook (fenêtre ${process.env.FACEBOOK_IMPORT_MAX_AGE_DAYS ?? "60"} jours)…\n`,
  );

  const result = await aggregateFacebookPagesGraph();

  console.log(JSON.stringify(result, null, 2));
  console.log(
    `\n✓ ${result.fetched} posts lus · ${result.inserted} externes · ` +
      `${result.articlesCreated ?? 0} articles créés · ` +
      `${result.articlesRepaired ?? 0} articles réparés · ` +
      `${result.eventsCreated ?? 0} événements · ` +
      `${result.announcementsCreated ?? 0} annonces`,
  );

  if (result.errors.length > 0) {
    console.error("\nErreurs:", result.errors.join("\n"));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
