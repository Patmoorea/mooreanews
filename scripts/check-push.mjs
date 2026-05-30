#!/usr/bin/env node
/** Vérifie push VAPID + tables Supabase en prod. */
const base = process.argv[2] ?? "https://www.mooreanews.com";

async function main() {
  console.log(`\nPush MooreaNews @ ${base}\n`);

  const vapid = await fetch(`${base}/api/push/vapid`).then((r) => r.json());
  console.log("VAPID:", vapid.ok ? "✅ configuré" : "❌ absent");
  if (vapid.publicKey) {
    console.log("  clé publique:", `${vapid.publicKey.slice(0, 20)}…`);
  }

  const status = await fetch(`${base}/api/push/status`).then((r) => r.json());
  console.log("Table push_subscriptions:", status.tableReady ? "✅" : "❌");
  console.log("Abonnés push:", status.pushSubscribers ?? 0);
  console.log("Abonnés email alertes:", status.emailSubscribers ?? 0);
  console.log("\n→ Activer:", `${base}/alertes`);
  console.log("→ Admin test:", `${base}/admin/setup\n`);

  if (!status.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
