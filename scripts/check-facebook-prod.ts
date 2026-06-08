import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("CRON_SECRET manquant dans .env.local");
    process.exit(1);
  }

  const healthRes = await fetch(
    `https://www.mooreanews.com/api/watch/facebook-health?secret=${encodeURIComponent(secret)}`,
  );
  console.log("=== Facebook health ===");
  console.log(await healthRes.text());

  const recentRes = await fetch(
    `https://www.mooreanews.com/api/watch/facebook-recent?secret=${encodeURIComponent(secret)}`,
    { signal: AbortSignal.timeout(120_000) },
  );
  console.log("\n=== Facebook recent ===", recentRes.status);
  console.log(await recentRes.text());

  const fbRes = await fetch(
    `https://www.mooreanews.com/api/cron/facebook?secret=${encodeURIComponent(secret)}`,
    { signal: AbortSignal.timeout(280_000) },
  );
  console.log("\n=== Cron Facebook ===", fbRes.status);
  console.log(await fbRes.text());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
