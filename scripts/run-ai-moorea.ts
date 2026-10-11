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
import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

config({ path: resolve(process.cwd(), ".env.local") });

process.env.OLLAMA_API_URL ??= "http://127.0.0.1:11434";
process.env.OLLAMA_MODEL ??= process.env.AI_VEILLE_MODEL ?? "llama3.2:3b";

const LOCK = resolve(tmpdir(), "moorea-ai-veille.lock");

/** % de mémoire libre macOS (memory_pressure) ; null si inconnu. */
function freeMemoryPct(): number | null {
  try {
    const out = execSync("/usr/bin/memory_pressure", {
      encoding: "utf8",
      timeout: 10_000,
    });
    const m = out.match(/free percentage:\s*(\d+)%/i);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

function acquireLock(): boolean {
  if (existsSync(LOCK)) {
    const pid = Number(readFileSync(LOCK, "utf8").trim());
    try {
      if (pid > 0) {
        process.kill(pid, 0);
        return false; // run précédent encore actif
      }
    } catch {
      /* verrou orphelin */
    }
  }
  writeFileSync(LOCK, String(process.pid));
  return true;
}

async function main() {
  console.log(`[ai:moorea] ${new Date().toString()}`);

  if (!acquireLock()) {
    console.log("[ai:moorea] run précédent encore en cours — skip");
    return;
  }
  process.on("exit", () => {
    try {
      unlinkSync(LOCK);
    } catch {
      /* ignore */
    }
  });

  const minFree = Number(process.env.AI_MIN_FREE_MEMORY_PCT ?? 35);
  const free = freeMemoryPct();
  if (free !== null && free < minFree) {
    console.log(
      `[ai:moorea] mémoire libre ${free}% < ${minFree}% — skip (protège les bots)`,
    );
    return;
  }

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
