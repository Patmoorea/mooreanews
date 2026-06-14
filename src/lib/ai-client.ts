/**
 * Client IA MooreaNews — Ollama local (gratuit) ou OpenAI compatible (optionnel).
 *
 * Prod Vercel sans Ollama distant → IA désactivée (pas de coût).
 * Mac local : Ollama http://127.0.0.1:11434 via npm run ai:moorea
 */

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiCompletionResult =
  | { ok: true; text: string; model: string; provider: "ollama" | "openai" }
  | { ok: false; error: string; skipped?: boolean };

export type AiProvider = "ollama" | "openai" | "none";

export function aiProvider(): AiProvider {
  if (process.env.AI_VEILLE_ENABLED === "false") return "none";
  if (process.env.OLLAMA_API_URL?.trim()) return "ollama";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (process.env.NODE_ENV !== "production") return "ollama";
  return "none";
}

export function isAiVeilleEnabled(): boolean {
  return aiProvider() !== "none";
}

export function aiModel(): string {
  if (aiProvider() === "ollama") {
    return (
      process.env.OLLAMA_MODEL?.trim() ||
      process.env.AI_VEILLE_MODEL?.trim() ||
      "llama3.2:3b"
    );
  }
  return process.env.AI_VEILLE_MODEL?.trim() || "gpt-4o-mini";
}

function ollamaBaseUrl(): string {
  return (
    process.env.OLLAMA_API_URL?.trim()?.replace(/\/$/, "") ||
    "http://127.0.0.1:11434"
  );
}

async function aiCompleteOllama(
  messages: AiChatMessage[],
  options?: { maxTokens?: number; temperature?: number },
): Promise<AiCompletionResult> {
  const model = aiModel();
  const url = `${ollamaBaseUrl()}/api/chat`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.35,
          num_predict: options?.maxTokens ?? 900,
        },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        error: `Ollama HTTP ${res.status}: ${errText.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as {
      message?: { content?: string };
      error?: string;
    };
    if (json.error) return { ok: false, error: json.error };
    const text = json.message?.content?.trim();
    if (!text) return { ok: false, error: "Réponse Ollama vide" };
    return { ok: true, text, model, provider: "ollama" };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
      return {
        ok: false,
        error: "Ollama inaccessible — lancez « ollama serve » sur le Mac",
        skipped: true,
      };
    }
    return { ok: false, error: msg };
  }
}

async function aiCompleteOpenAi(
  messages: AiChatMessage[],
  options?: { maxTokens?: number; temperature?: number },
): Promise<AiCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "OPENAI_API_KEY manquant", skipped: true };
  }

  const baseUrl =
    process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
  const model = aiModel();

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 1200,
        temperature: options?.temperature ?? 0.4,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        error: `HTTP ${res.status}: ${errText.slice(0, 300)}`,
      };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "Réponse IA vide" };
    return { ok: true, text, model, provider: "openai" };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function aiComplete(
  messages: AiChatMessage[],
  options?: { maxTokens?: number; temperature?: number },
): Promise<AiCompletionResult> {
  const provider = aiProvider();
  if (provider === "none") {
    return {
      ok: false,
      error: "IA désactivée (AI_VEILLE_ENABLED=false ou pas d'Ollama/OpenAI)",
      skipped: true,
    };
  }
  if (provider === "ollama") return aiCompleteOllama(messages, options);
  return aiCompleteOpenAi(messages, options);
}

/** Parse une réponse JSON de l’IA (avec fallback extraction). */
export function parseAiJson<T extends Record<string, unknown>>(
  raw: string,
): T | null {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
