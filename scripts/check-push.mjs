#!/usr/bin/env node
/** Vérifie push VAPID + tables Supabase en prod. */
const base = (process.argv[2] ?? "https://www.mooreanews.com").replace(/\/$/, "");

async function fetchJson(path) {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      html: text.slice(0, 120),
    };
  }
}

async function main() {
  console.log(`\nPush MooreaNews @ ${base}\n`);

  const vapid = await fetchJson("/api/push/vapid");
  if (!vapid.data) {
    console.log("VAPID:", `❌ réponse non-JSON (HTTP ${vapid.status})`);
    if (vapid.html) console.log("  ", vapid.html, "…");
    console.log("\n→ Déployez le dernier commit sur Vercel (route /api/push/vapid).\n");
    process.exit(1);
  }
  console.log("VAPID public:", vapid.data.ok ? "✅" : "❌");
  if (vapid.data.publicKey) {
    console.log("  clé:", `${vapid.data.publicKey.slice(0, 24)}…`);
  }

  const status = await fetchJson("/api/push/status");
  if (!status.data) {
    console.log("Status:", `❌ réponse non-JSON (HTTP ${status.status}) — redeploy Vercel`);
    if (status.html) console.log("  ", status.html, "…");
    process.exit(1);
  }

  const s = status.data;
  console.log("VAPID private (serveur):", s.privateKeySet ? "✅" : "❌ MANQUANTE");
  console.log("Table push_subscriptions:", s.tableReady ? "✅" : "❌");
  console.log("Abonnés push:", s.pushSubscribers ?? 0);
  console.log("Abonnés email alertes:", s.emailSubscribers ?? 0);
  if (s.hint) console.log("\n→", s.hint);
  console.log("\n→ Activer:", `${base}/alertes`);
  console.log("→ Admin test:", `${base}/admin/setup\n`);

  if (!s.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
