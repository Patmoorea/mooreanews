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

function sanitizeText(
  value: string | null | undefined,
  maxLen: number,
): string | null {
  if (value == null) return null;
  const cleaned = cleanImportedText(value)
    .replace(/^\uFEFF/, "")
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLen);
}

function sanitizeUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u?.startsWith("http")) return null;
  return u.length > 2048 ? u.slice(0, 2048) : u;
}

function normalizeRow(row: ExternalArticleUpsertRow) {
  const title =
    sanitizeText(row.title, 500) ?? row.source_name.slice(0, 500);
  return {
    source_id: row.source_id.slice(0, 120),
    source_name: sanitizeText(row.source_name, 200) ?? row.source_name.slice(0, 200),
    external_id: row.external_id.slice(0, 240),
    url: sanitizeUrl(row.url) ?? row.url.slice(0, 2048),
    title,
    excerpt: sanitizeText(row.excerpt, 500),
    image_url: sanitizeUrl(row.image_url),
    author: row.author ? sanitizeText(row.author, 200) : null,
    published_at: row.published_at,
    hidden: row.hidden ?? false,
    fetched_at: row.fetched_at ?? new Date().toISOString(),
  };
}

const CHUNK_SIZE = 12;

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
      const { error: rowErr, count: rowCount } = await supabase
        .from("external_articles")
        .upsert(row, { onConflict: "source_id,external_id" });
      if (!rowErr) {
        inserted += rowCount ?? 1;
      } else {
        errors.push(
          `${row.source_id}/${row.external_id}: ${rowErr.message}`,
        );
      }
    }
  }

  return { inserted, errors };
}
