#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { expirePastEvents } = await import("../src/lib/event-expiry");
  const result = await expirePastEvents();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
