/**
 * Agent IA Moorea — résumé veille + brouillons d’articles.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import { aiDraftSlug, aiSourceTag, draftArticleFromExternal, isAiVeilleEnabled, summarizeMooreaHeadlines, type ExternalArticleInput } from "@/lib/ai-moorea";
import { isSlugImportBlocked } from "@/lib/import-blocklist";
import { SITE } from "@/lib/constants";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import { RSS_SOURCES } from "@/lib/rss-sources";
import { fetchArticleText } from "@/lib/news-article-fetch";
import { sendAiDraftForReview } from "@/lib/telegram-ai-drafts";
import { persistRemoteCover } from "@/lib/remote-cover-persist";

const MAX_ITEMS_PER_RUN = 5;
const MAX_FETCH_ATTEMPTS = 12;
const LOOKBACK_HOURS = 72;

/**
 * Sources traitées par l’IA : flux RSS non publiés automatiquement
 * (Google Actualités Moorea, La 1ère, Gouvernement, coupures).
 * Exclut web-watch / facebook-watch (titres de pages d’accueil, pas d’actu).
 * Surcharge : AI_VEILLE_SOURCE_IDS=id1,id2
 */
export function aiVeilleSourceIds(): string[] {
  const raw = process.env.AI_VEILLE_SOURCE_IDS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return RSS_SOURCES.filter((s) => !s.autoPublishAsArticles).map((s) => s.id);
}

/** Publication directe si l’IA juge l’info « Moorea » (sinon brouillon). */
function aiAutoPublishEnabled(): boolean {
  return process.env.AI_VEILLE_AUTO_PUBLISH === "true";
}

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 3),
  );
}

function similarTitle(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter += 1;
  return inter / Math.min(a.size, b.size) >= 0.6;
}

/**
 * Même événement couvert par plusieurs médias (titres très différents :
 * « Incendie de brousse à Afareaitu » vs « Un hectare brûlé à Afareaitu »).
 * Même type d’événement + même lieu de Moorea sur 72 h = doublon.
 */
const EVENT_GROUPS: string[][] = [
  ["incendie", "incendies", "feu", "feux", "brousse", "brule", "brules", "brulee", "flammes", "hectare", "hectares"],
  ["blocus", "greve", "manifestation", "mobilisation"],
  ["accident", "collision", "carambolage"],
  ["noyade", "noye", "disparu", "disparition", "recherches"],
  ["coupure", "panne", "electricite"],
  ["tempete", "houle", "vigilance", "inondation", "inondations", "eboulement"],
];
const MOOREA_PLACES = [
  "afareaitu", "haapiti", "paopao", "papetoai", "maharepa", "teavaro", "vaiare",
  "temae", "tiahura", "opunohu", "maiao", "hauru", "varari", "pihaena", "atiha",
];

function eventKey(text: string): { events: Set<number>; places: Set<string> } {
  const words = new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" "),
  );
  const events = new Set<number>();
  EVENT_GROUPS.forEach((g, i) => {
    if (g.some((w) => words.has(w))) events.add(i);
  });
  const places = new Set(MOOREA_PLACES.filter((p) => words.has(p)));
  return { events, places };
}

function sameEvent(
  a: { events: Set<number>; places: Set<string> },
  b: { events: Set<number>; places: Set<string> },
): boolean {
  const ev = [...a.events].some((e) => b.events.has(e));
  const pl = [...a.places].some((p) => b.places.has(p));
  return ev && pl;
}

export type AiVeilleDraft = {
  slug: string;
  title: string;
  excerpt: string;
  created: boolean;
  skipped: boolean;
  error?: string;
};

export type AiVeilleResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  processed: number;
  draftsCreated: number;
  drafts: AiVeilleDraft[];
  headlineSummary?: string | null;
  errors: string[];
  durationMs: number;
};

async function alreadyProcessed(
  sourceId: string,
  externalId: string,
): Promise<boolean> {
  const supabase = getAdminSupabase();
  if (!supabase) return false;
  const tag = aiSourceTag(sourceId, externalId);
  const { data } = await supabase
    .from("articles")
    .select("id")
    .contains("tags", [tag])
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function runAiVeilleProcessing(): Promise<AiVeilleResult> {
  const start = Date.now();
  const errors: string[] = [];
  const drafts: AiVeilleDraft[] = [];

  if (!isAiVeilleEnabled()) {
    return {
      ok: true,
      skipped: true,
      reason: "IA désactivée — utilisez Ollama local (npm run ai:moorea) ou OLLAMA_API_URL",
      processed: 0,
      draftsCreated: 0,
      drafts,
      errors,
      durationMs: Date.now() - start,
    };
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    return {
      ok: false,
      reason: "supabase_missing",
      processed: 0,
      draftsCreated: 0,
      drafts,
      errors: ["Supabase non configuré"],
      durationMs: Date.now() - start,
    };
  }

  const since = new Date(
    Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data: items, error: fetchErr } = await supabase
    .from("external_articles")
    .select(
      "id, source_id, source_name, external_id, url, title, excerpt, image_url, published_at",
    )
    .eq("hidden", false)
    .in("source_id", aiVeilleSourceIds())
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(30);

  if (fetchErr) {
    return {
      ok: false,
      processed: 0,
      draftsCreated: 0,
      drafts,
      errors: [fetchErr.message],
      durationMs: Date.now() - start,
    };
  }

  let processed = 0;
  let draftsCreated = 0;
  let fetchAttempts = 0;
  const reviewQueue: Parameters<typeof sendAiDraftForReview>[0][] = [];
  const newTitles: string[] = [];

  // Articles déjà en ligne (Tahiti Infos auto, Facebook…) → pas de doublon IA.
  const { data: recentArticles } = await supabase
    .from("articles")
    .select("title")
    .gte(
      "published_at",
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    )
    .limit(400);
  const existingTitles = (recentArticles ?? []).map((a) =>
    titleTokens(String(a.title ?? "")),
  );

  // Événements déjà couverts (publiés, brouillons en attente OU rejetés) sur 72 h.
  const { data: recentEvents } = await supabase
    .from("articles")
    .select("title, excerpt")
    .gte("created_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
    .limit(400);
  const coveredEvents = (recentEvents ?? []).map((a) =>
    eventKey(`${a.title ?? ""} ${a.excerpt ?? ""}`),
  );

  for (const item of (items ?? []) as ExternalArticleInput[]) {
    if (processed >= MAX_ITEMS_PER_RUN) break;
    if (fetchAttempts >= MAX_FETCH_ATTEMPTS) break;

    if (await alreadyProcessed(item.source_id, item.external_id)) {
      drafts.push({
        slug: "",
        title: item.title,
        excerpt: "",
        created: false,
        skipped: true,
      });
      continue;
    }

    const tokens = titleTokens(item.title);
    const itemEvent = eventKey(item.title);
    if (
      existingTitles.some((t) => similarTitle(tokens, t)) ||
      coveredEvents.some((e) => sameEvent(itemEvent, e))
    ) {
      drafts.push({
        slug: "",
        title: item.title,
        excerpt: "déjà publié",
        created: false,
        skipped: true,
      });
      continue;
    }

    fetchAttempts += 1;
    const source = await fetchArticleText(item.url);
    if (!source) {
      errors.push(`Texte source illisible: ${item.title.slice(0, 50)}`);
      continue;
    }

    processed += 1;
    const draft = await draftArticleFromExternal(item, {
      text: source.text,
      url: source.url,
    });
    if (!draft) {
      errors.push(`IA échec: ${item.title.slice(0, 50)}`);
      continue;
    }

    const slug = aiDraftSlug(draft.title, item.source_id);
    const tag = aiSourceTag(item.source_id, item.external_id);

    if (await isSlugImportBlocked(slug)) {
      drafts.push({
        slug,
        title: draft.title,
        excerpt: draft.excerpt,
        created: false,
        skipped: true,
      });
      continue;
    }

    // Même événement déjà couvert (vu après rédaction : titre IA + chapô).
    const draftEvent = eventKey(`${draft.title} ${draft.excerpt}`);
    if (coveredEvents.some((e) => sameEvent(draftEvent, e))) {
      drafts.push({ slug, title: draft.title, excerpt: "déjà couvert", created: false, skipped: true });
      continue;
    }
    // Garde-fou chiffres : tout nombre du titre/chapô doit exister dans la source
    // (ex. « 1000 hectares » inventé alors que la source dit « un hectare »).
    const sourceDigits = source.text.replace(/[\s\u00a0\u202f]/g, "");
    const inventedNumber = (`${draft.title} ${draft.excerpt}`.match(/\d[\d\s\u00a0\u202f.,]*/g) ?? [])
      .map((n) => n.replace(/[\s\u00a0\u202f]/g, "").replace(/[.,]$/, ""))
      .find((n) => n.length > 0 && !sourceDigits.includes(n));
    if (inventedNumber) {
      errors.push(`Chiffre absent de la source (${inventedNumber}) : ${draft.title.slice(0, 50)}`);
      continue;
    }

    const published = draft.publish && aiAutoPublishEnabled();
    // Copie la photo dans Supabase : sinon couverture cassée sur le site
    // (domaine non autorisé par next/image) alors que Telegram l’affiche.
    const remoteCover = item.image_url ?? source.imageUrl;
    const coverUrl =
      (await persistRemoteCover(supabase, remoteCover, slug)) ?? null;
    const { data: inserted, error: insertErr } = await supabase.from("articles").insert({
      slug,
      title: draft.title,
      excerpt: draft.excerpt,
      body: draft.body,
      category: draft.category,
      tags: ["ai-draft", "veille-ia", tag, item.source_id],
      cover_url: coverUrl,
      author: "Agent IA Moorea",
      featured: false,
      published,
      published_at: item.published_at,
    }).select("id").single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        drafts.push({
          slug,
          title: draft.title,
          excerpt: draft.excerpt,
          created: false,
          skipped: true,
        });
      } else {
        errors.push(`${slug}: ${insertErr.message}`);
      }
      continue;
    }

    draftsCreated += 1;
    newTitles.push(draft.title);
    coveredEvents.push(draftEvent);
    if (!published && inserted?.id) {
      reviewQueue.push({
        id: String(inserted.id),
        slug,
        title: draft.title,
        excerpt: draft.excerpt,
        body: draft.body,
        category: draft.category,
      });
    }
    drafts.push({
      slug,
      title: draft.title,
      excerpt: draft.excerpt,
      created: true,
      skipped: false,
    });
    existingTitles.push(titleTokens(draft.title));
  }

  const headlineSummary =
    newTitles.length > 0 ? await summarizeMooreaHeadlines(newTitles) : null;

  if (draftsCreated > 0) {
    const parts = [
      `<b>🤖 Agent IA Moorea — ${draftsCreated} brouillon(s)</b>`,
    ];
    if (headlineSummary) parts.push("", escapeHtml(headlineSummary));
    parts.push(
      "",
      reviewQueue.length > 0
        ? `<i>À valider ci-dessous : ✅ Publier · ❌ Rejeter · ✏️ Plus tard</i>`
        : `<i>Publiés automatiquement (AI_VEILLE_AUTO_PUBLISH) — <a href="${SITE.url}/actualites">voir le site</a></i>`,
    );
    await sendTelegramNotification(parts.join("\n"));

    // Un message par brouillon avec boutons de modération (bot admin).
    for (const d of reviewQueue) {
      const r = await sendAiDraftForReview(d);
      if (!r.ok) errors.push(`telegram ${d.slug}: ${r.error ?? "échec"}`);
    }
  }

  return {
    ok: true,
    processed,
    draftsCreated,
    drafts,
    headlineSummary,
    errors,
    durationMs: Date.now() - start,
  };
}
