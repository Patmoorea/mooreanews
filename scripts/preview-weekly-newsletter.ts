#!/usr/bin/env npx tsx
/** Aperçu HTML newsletter semaine — sans envoi email. */
import { writeFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { gatherWeeklyNewsletterData, buildWeeklyNewsletterHtml } = await import(
    "../src/lib/weekly-newsletter"
  );

  const data = await gatherWeeklyNewsletterData();
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Aperçu newsletter — ${data.week.label}</title>
  <style>body{background:#e2e8f0;padding:24px;margin:0}</style>
</head>
<body>
${buildWeeklyNewsletterHtml(data)}
</body>
</html>`;

  const out = join(process.cwd(), "preview-weekly-newsletter.html");
  writeFileSync(out, html, "utf8");

  console.log("Semaine:", data.week.label);
  console.log("Événements:", data.events.length);
  console.log("Alertes:", data.alerts.length);
  console.log("Actus:", data.articles.length);
  console.log("Annonces:", data.announcements.length);
  console.log("Coupures:", data.outages.length);
  console.log("Emploi:", data.jobs.length);
  console.log("\nFichier:", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
