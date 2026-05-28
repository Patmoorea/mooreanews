#!/usr/bin/env node
/**
 * Vérifie les APIs « live » et la config veille.
 * Usage : node scripts/check-live-services.mjs [baseUrl]
 * Ex.     node scripts/check-live-services.mjs https://www.mooreanews.com
 */

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const endpoints = [
  { path: "/api/watch/status", label: "Veille (diagnostic)" },
  { path: "/api/weather", label: "Météo", check: (j) => j?.temp != null },
  { path: "/api/ferries", label: "Ferries", check: (j) => j?.fromMoorea != null },
  { path: "/api/tides", label: "Marées", check: (j) => Array.isArray(j?.tides) },
  { path: "/api/sun", label: "Soleil / lune", check: (j) => j?.sunrise },
  {
    path: "/api/forecast",
    label: "Prévisions",
    check: (j) => Array.isArray(j) && j.length > 0,
  },
  { path: "/api/alerts", label: "Alertes", check: (j) => Array.isArray(j?.alerts) },
];

let failed = 0;

console.log(`\nMooreaNews — contrôle live @ ${base}\n`);

for (const { path, label, check } of endpoints) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    const ok = res.ok && (check ? check(json) : json != null);
    const cache = res.headers.get("cache-control") ?? "—";
    console.log(
      ok ? "✓" : "✗",
      label.padEnd(22),
      res.status,
      cache.slice(0, 50),
    );
    if (!ok) {
      failed++;
      console.log("  ", JSON.stringify(json)?.slice(0, 120));
    }
    if (path === "/api/watch/status" && json) {
      console.log(
        "   → ready:",
        json.ready,
        "| RSS:",
        json.rssSources,
        "| articles visibles:",
        json.externalArticlesVisible,
        "| cronSecret:",
        json.config?.cronSecret,
      );
    }
  } catch (e) {
    failed++;
    console.log("✗", label.padEnd(22), "ERR", String(e));
  }
}

console.log(
  "\nVeille RSS/Facebook : cron Vercel `0 4 * * *` UTC = 18h00 Tahiti, 1×/jour.\n",
);
process.exit(failed > 0 ? 1 : 0);
