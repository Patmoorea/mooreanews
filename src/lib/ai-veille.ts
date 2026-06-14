/**
 * Agent IA Moorea — résumé veille + brouillons d’articles.
 */

import {
  aiDraftSlug,
  aiSourceTag,
  draftArticleFromExternal,
  isAiVeilleEnabled,
  summarizeMooreaHeadlines,
  type ExternalArticleInput,
} from "@/lib/ai-moorea";
import { SITE } from "@/lib/constants";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";

const MAX_ITEMS_PER_RUN = 5;
const LOOKBACK_HOURS = 48;

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
  const newTitles: string[] = [];

  for (const item of (items ?? []) as ExternalArticleInput[]) {
    if (processed >= MAX_ITEMS_PER_RUN) break;

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

    processed += 1;
    const draft = await draftArticleFromExternal(item);
    if (!draft) {
      errors.push(`IA échec: ${item.title.slice(0, 50)}`);
      continue;
    }

    const slug = aiDraftSlug(draft.title, item.source_id);
    const tag = aiSourceTag(item.source_id, item.external_id);

    const { error: insertErr } = await supabase.from("articles").insert({
      slug,
      title: draft.title,
      excerpt: draft.excerpt,
      body: draft.body,
      category: draft.category,
      tags: ["ai-draft", "veille-ia", tag, item.source_id],
      cover_url: item.image_url,
      author: "Agent IA Moorea",
      featured: false,
      published: draft.publish,
      published_at: item.published_at,
    });

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
    drafts.push({
      slug,
      title: draft.title,
      excerpt: draft.excerpt,
      created: true,
      skipped: false,
    });
  }

  const headlineSummary =
    newTitles.length > 0 ? await summarizeMooreaHeadlines(newTitles) : null;

  if (draftsCreated > 0 || headlineSummary) {
    const lines = drafts
      .filter((d) => d.created)
      .map(
        (d) =>
          `• <a href="${SITE.url}/admin/articles">${escapeHtml(d.title)}</a>`,
      );

    const parts = [
      `<b>🤖 Agent IA Moorea — ${draftsCreated} brouillon(s)</b>`,
      "",
    ];

    if (headlineSummary) {
      parts.push(escapeHtml(headlineSummary), "");
    }

    if (lines.length) {
      parts.push(...lines, "");
    }

    parts.push(`<i>Modération : Admin → Articles (tag ai-draft)</i>`);

    await sendTelegramNotification(parts.join("\n"));
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
