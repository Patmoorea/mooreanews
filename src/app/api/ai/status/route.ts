import { NextResponse } from "next/server";
import { aiModel, aiProvider, isAiVeilleEnabled } from "@/lib/ai-client";

export const dynamic = "force-dynamic";

/** Statut Agent IA Moorea (sans secrets). */
export async function GET() {
  const provider = aiProvider();
  const enabled = isAiVeilleEnabled();

  return NextResponse.json({
    enabled,
    provider,
    model: enabled ? aiModel() : null,
    billing: provider === "openai" ? "cloud_paid" : provider === "ollama" ? "local_free" : "none",
    features: {
      veilleDrafts: enabled,
      signalementAnalysis: enabled,
      headlineSummary: enabled,
    },
    localMac: {
      command: "npm run ai:moorea",
      ollama: "ollama serve && ollama pull llama3.2:3b",
      cronExample:
        "0 5-20 * * * cd ~/Desktop/moorea-hub && npm run ai:moorea >> /tmp/moorea-ai.log 2>&1",
    },
    endpoints: {
      veilleCron: "/api/cron/ai?secret=CRON_SECRET&wait=1 (skip si pas Ollama distant)",
      veilleChain: "/api/cron/aggregate?part=ai&wait=1 (optionnel GitHub)",
    },
    hint:
      provider === "none"
        ? "Sur Vercel : IA off (gratuit). Sur Mac : Ollama + npm run ai:moorea. Pas besoin d'OPENAI_API_KEY."
        : provider === "ollama"
          ? "Ollama actif — IA locale gratuite"
          : "OpenAI cloud actif (optionnel payant)",
  });
}
