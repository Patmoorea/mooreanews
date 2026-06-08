import { config } from "dotenv";

config({ path: ".env.local" });

import { syncWeeklyRecapFromMooreaNews } from "../src/lib/weekly-recap-sync";

async function main() {
  const result = await syncWeeklyRecapFromMooreaNews();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
