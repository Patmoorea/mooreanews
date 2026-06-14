#!/usr/bin/env npx tsx
/**
 * Agent IA Moorea — Ollama local (Mac).
 *
 * Prérequis :
 *   ollama serve
 *   ollama pull llama3.2:3b
 *
 * Usage :
 *   npm run ai:moorea
 *   OLLAMA_MODEL=mistral-nemo:12b npm run ai:moorea
 *
 * Cron Mac (toutes les heures en journée Tahiti) :
 *   0 5-20 * * * cd ~/Desktop/moorea-hub && npm run ai:moorea >> /tmp/moorea-ai.log 2>&1
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

process.env.OLLAMA_API_URL ??= "http://127.0.0.1:11434";
process.env.OLLAMA_MODEL ??= process.env.AI_VEILLE_MODEL ?? "llama3.2:3b";

async function main() {
  const { aiProvider, aiModel, isAiVeilleEnabled } = await import(
    "../src/lib/ai-client"
  );
  const { runAiVeilleProcessing } = await import("../src/lib/ai-veille");

  console.log(`[ai:moorea] provider=${aiProvider()} model=${aiModel()}`);

  if (!isAiVeilleEnabled()) {
    console.error("IA désactivée. Vérifiez ollama serve et AI_VEILLE_ENABLED.");
    process.exit(1);
  }

  const result = await runAiVeilleProcessing();
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok && !result.skipped) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
