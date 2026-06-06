/**
 * Upsert robuste vers external_articles (veille RSS / Facebook / web).
 */

import { cleanImportedText } from "@/lib/html-entities";
import { getAdminSupabase } from "@/lib/supabase/admin";

export type ExternalArticleUpsertRow = {
  source_id: string;
  source_name: string;
  external_id: string;
  url: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  author?: string | null;
  published_at: string;
  hidden?: boolean;
  fetched_at?: string;
};

type NormalizedRow = ReturnType<typeof normalizeRow>;

function stripLoneSurrogates(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += value[i] + value[i + 1];
        i++;
      }
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue;
    out += value[i];
  }
  return out;
}

function sanitizeText(
  value: string | null | undefined,
  maxLen: number,
): string | null {
  if (value == null) return null;
  const cleaned = stripLoneSurrogates(
    cleanImportedText(value)
      .replace(/^\uFEFF/, "")
      .replace(/\u0000/g, "")
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
      .trim(),
  );
  if (!cleaned) return null;
  return cleaned.slice(0, maxLen);
}

function sanitizeUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u?.startsWith("http")) return null;
  const safe = stripLoneSurrogates(u);
  return safe.length > 2048 ? safe.slice(0, 2048) : safe;
}

function normalizePublishedAt(value: string): string {
  const ms = Date.parse(value);
  if (!Number.isNaN(ms)) return new Date(ms).toISOString();
  return new Date().toISOString();
}

function normalizeRow(row: ExternalArticleUpsertRow) {
  const title =
    sanitizeText(row.title, 500) ?? row.source_name.slice(0, 500);
  return {
    source_id: row.source_id.slice(0, 120),
    source_name:
      sanitizeText(row.source_name, 200) ?? row.source_name.slice(0, 200),
    external_id: row.external_id.slice(0, 240),
    url: sanitizeUrl(row.url) ?? stripLoneSurrogates(row.url).slice(0, 2048),
    title,
    excerpt: sanitizeText(row.excerpt, 500),
    image_url: sanitizeUrl(row.image_url),
    author: row.author ? sanitizeText(row.author, 200) : null,
    published_at: normalizePublishedAt(row.published_at),
    hidden: row.hidden ?? false,
    fetched_at: row.fetched_at ?? new Date().toISOString(),
  };
}

function minimalRow(row: NormalizedRow): NormalizedRow {
  return {
    ...row,
    title: sanitizeText(row.title, 200) ?? row.source_name.slice(0, 200),
    excerpt: null,
    image_url: null,
    author: null,
  };
}

function isJsonUpsertError(message: string): boolean {
  return /empty or invalid json|invalid input syntax for type json/i.test(
    message,
  );
}

const CHUNK_SIZE = 12;

async function upsertOne(
  supabase: NonNullable<ReturnType<typeof getAdminSupabase>>,
  row: NormalizedRow,
): Promise<{ ok: true; count: number } | { ok: false; message: string }> {
  const attempt = async (
    payload: NormalizedRow,
  ): Promise<{ error: string } | { count: number }> => {
    const { error, count } = await supabase
      .from("external_articles")
      .upsert(payload, { onConflict: "source_id,external_id" });
    if (error) return { error: error.message };
    return { count: count ?? 1 };
  };

  const first = await attempt(row);
  if (!("error" in first)) {
    return { ok: true, count: first.count };
  }
  if (!isJsonUpsertError(first.error)) {
    return { ok: false, message: first.error };
  }

  const second = await attempt(minimalRow(row));
  if (!("error" in second)) {
    return { ok: true, count: second.count };
  }
  return { ok: false, message: second.error };
}

/** Upsert par lots ; repli ligne par ligne si un lot échoue. */
export async function upsertExternalArticleRows(
  rows: ExternalArticleUpsertRow[],
): Promise<{ inserted: number; errors: string[] }> {
  const supabase = getAdminSupabase();
  if (!supabase || rows.length === 0) return { inserted: 0, errors: [] };

  const normalized = rows.map(normalizeRow);
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < normalized.length; i += CHUNK_SIZE) {
    const chunk = normalized.slice(i, i + CHUNK_SIZE);
    const { error, count } = await supabase
      .from("external_articles")
      .upsert(chunk, { onConflict: "source_id,external_id" });

    if (!error) {
      inserted += count ?? chunk.length;
      continue;
    }

    for (const row of chunk) {
      const result = await upsertOne(supabase, row);
      if (result.ok) {
        inserted += result.count;
      } else {
        errors.push(
          `${row.source_id}/${row.external_id}: ${result.message}`,
        );
      }
    }
  }

  return { inserted, errors };
}
