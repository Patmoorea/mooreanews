/**
 * Agent IA Moorea — prompts et fonctions métier (veille, signalements).
 * Couche au-dessus de ai-client.ts (API OpenAI compatible).
 */

import {
  aiComplete,
  aiModel,
  isAiVeilleEnabled,
  parseAiJson,
} from "@/lib/ai-client";

export { isAiVeilleEnabled, aiModel };

const JOURNALIST_SYSTEM = `Tu es l'agent IA de MooreaNews, média local de l'île de Moorea (Polynésie française).
Tu rédiges en français, ton factuel et accessible, sans sensationnalisme.
Ne invente jamais de faits absents de la source.
Pour les urgences vitales, rappelle d'appeler le 15.`;

export type SignalementAiAnalysis = {
  summary: string;
  urgent: boolean;
  suggestedAlertTitle: string;
  confidence: "high" | "medium" | "low";
  flags: string[];
};

export type ExternalArticleInput = {
  source_id: string;
  source_name: string;
  external_id: string;
  url: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
};

export type ArticleDraft = {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  publish: boolean;
};

export async function analyzeSignalementWithAi(input: {
  categoryId: string;
  categoryLabel: string;
  description: string;
  location?: string;
  district?: string;
}): Promise<SignalementAiAnalysis | null> {
  if (!isAiVeilleEnabled()) return null;

  const result = await aiComplete(
    [
      { role: "system", content: JOURNALIST_SYSTEM },
      {
        role: "user",
        content: `Analyse ce signalement citoyen Moorea et réponds UNIQUEMENT en JSON :
{
  "summary": "résumé factuel 2-3 phrases",
  "urgent": true/false,
  "suggestedAlertTitle": "titre alerte max 100 car.",
  "confidence": "high|medium|low",
  "flags": ["liste", "de", "drapeaux", "ex: incohérence, doublon possible, info non vérifiable"]
}

Catégorie : ${input.categoryLabel} (${input.categoryId})
Description : ${input.description}
Lieu : ${input.location ?? "non précisé"}
Quartier : ${input.district ?? "non précisé"}`,
      },
    ],
    { maxTokens: 400, temperature: 0.2 },
  );

  if (!result.ok) return null;

  const parsed = parseAiJson<SignalementAiAnalysis>(result.text);
  if (!parsed?.summary || !parsed.suggestedAlertTitle) return null;
  return parsed;
}

export async function draftArticleFromExternal(
  item: ExternalArticleInput,
): Promise<ArticleDraft | null> {
  if (!isAiVeilleEnabled()) return null;

  const result = await aiComplete(
    [
      {
        role: "system",
        content: `${JOURNALIST_SYSTEM}\nRéponds uniquement en JSON valide, sans markdown autour.`,
      },
      {
        role: "user",
        content: `Produis un brouillon d'article MooreaNews à partir de cette source externe.

JSON attendu :
{
  "title": "max 120 car.",
  "excerpt": "chapô max 280 car.",
  "body": "2-4 paragraphes markdown",
  "category": "actualites|meteo|transport|culture",
  "publish": false
}

publish=true SEULEMENT si l'info concerne clairement Moorea ou impacte directement ses résidents.

Source : ${item.source_name}
Titre : ${item.title}
Extrait : ${item.excerpt ?? ""}
URL : ${item.url}`,
      },
    ],
    { maxTokens: 900, temperature: 0.35 },
  );

  if (!result.ok) return null;

  const parsed = parseAiJson<ArticleDraft>(result.text);
  if (!parsed?.title || !parsed.body) return null;

  const sourceLine = `\n\n---\n*Source : [${item.source_name}](${item.url})*`;
  return {
    title: parsed.title.slice(0, 200),
    excerpt: (parsed.excerpt ?? parsed.title).slice(0, 280),
    body: parsed.body + sourceLine,
    category: parsed.category ?? "actualites",
    publish: Boolean(parsed.publish),
  };
}

/** Résumé court pour digest Telegram / admin. */
export async function summarizeMooreaHeadlines(
  titles: string[],
): Promise<string | null> {
  if (!isAiVeilleEnabled() || titles.length === 0) return null;

  const result = await aiComplete(
    [
      { role: "system", content: JOURNALIST_SYSTEM },
      {
        role: "user",
        content: `Résume en 3-4 phrases ce qui se passe à Moorea d'après ces titres de veille (sans inventer) :

${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
      },
    ],
    { maxTokens: 350, temperature: 0.3 },
  );

  return result.ok ? result.text : null;
}

export function aiSourceTag(sourceId: string, externalId: string): string {
  return `ai-src-${sourceId}-${externalId.slice(0, 40)}`;
}

export function aiDraftSlug(title: string, sourceId: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `ia-${sourceId}-${base || "moorea"}`.slice(0, 90);
}
