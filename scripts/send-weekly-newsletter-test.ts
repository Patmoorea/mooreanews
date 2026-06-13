#!/usr/bin/env npx tsx
/** Envoi test newsletter — une adresse uniquement. */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/send-weekly-newsletter-test.ts <email>");
    process.exit(1);
  }

  const { sendWeeklyNewsletter } = await import("../src/lib/weekly-newsletter");
  const result = await sendWeeklyNewsletter({ testTo: [email] });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.sent > 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
