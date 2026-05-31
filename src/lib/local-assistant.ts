/**
 * Assistant Moorea — recherche factuelle dans FAQ + infos pratiques uniquement.
 * Aucune génération inventée : si pas de match, on le dit.
 */

import { listFaqEntries } from "@/lib/faq";
import { getInfoPratiques } from "@/lib/content";

export type AssistantHit = {
  kind: "faq" | "info";
  title: string;
  excerpt: string;
  href: string;
  score: number;
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(q: string): string[] {
  return normalize(q)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function scoreText(corpus: string, tokens: string[]): number {
  const norm = normalize(corpus);
  let score = 0;
  for (const t of tokens) {
    if (norm.includes(t)) score += 1;
  }
  return score;
}

export async function searchLocalAssistant(query: string): Promise<{
  hits: AssistantHit[];
  tokens: string[];
}> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return { hits: [], tokens: [] };

  const [faq, infos] = await Promise.all([listFaqEntries(), getInfoPratiques()]);
  const hits: AssistantHit[] = [];

  for (const f of faq) {
    const corpus = `${f.question} ${f.answer} ${f.category} ${f.district ?? ""}`;
    const score = scoreText(corpus, tokens);
    if (score <= 0) continue;
    hits.push({
      kind: "faq",
      title: f.question,
      excerpt: f.answer.slice(0, 220),
      href: `/qui-sait-quoi#${f.slug}`,
      score,
    });
  }

  for (const i of infos) {
    const corpus = `${i.title} ${i.description} ${i.category} ${i.address ?? ""} ${i.hours ?? ""} ${i.phone ?? ""}`;
    const score = scoreText(corpus, tokens);
    if (score <= 0) continue;
    hits.push({
      kind: "info",
      title: i.title,
      excerpt: [i.description, i.phone, i.hours].filter(Boolean).join(" · ").slice(0, 220),
      href: `/infos-pratiques/${i.slug}`,
      score,
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return { hits: hits.slice(0, 8), tokens };
}

/** Suggestions rapides sans requête. */
export const ASSISTANT_SUGGESTIONS = [
  "médecin Moorea",
  "ferry Tahiti",
  "marché Pao Pao",
  "pharmacie",
  "RAI TAHITI",
  "OPT",
  "numéro urgence",
];
