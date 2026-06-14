/**
 * Upsert robuste vers external_articles (veille RSS / Facebook / web).
 * Ne supprime jamais le texte ni l’image : nettoie les caractères invalides.
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

/** Retire les caractères illégaux UTF-8 / JSON — le reste du texte est conservé. */
function scrubInvalidChars(value: string): string {
  const normalized = stripLoneSurrogates(value.normalize("NFKC"));
  return [...normalized]
    .filter((ch) => {
      const code = ch.codePointAt(0)!;
      if (code === 0x9 || code === 0xa || code === 0xd) return true;
      if (code < 0x20 || code === 0x7f) return false;
      if (code >= 0xd800 && code <= 0xdfff) return false;
      return true;
    })
    .join("");
}

function sanitizeText(
  value: string | null | undefined,
  maxLen: number,
): string | null {
  if (value == null) return null;
  const cleaned = cleanImportedText(scrubInvalidChars(value))
    .replace(/^\uFEFF/, "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLen);
}

function sanitizeUrl(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw?.startsWith("http")) return null;
  try {
    const href = new URL(scrubInvalidChars(raw)).href;
    return href.length > 2048 ? href.slice(0, 2048) : href;
  } catch {
    const safe = scrubInvalidChars(raw);
    return safe.startsWith("http") && safe.length <= 2048 ? safe : null;
  }
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
    source_id: scrubInvalidChars(row.source_id).slice(0, 120),
    source_name:
      sanitizeText(row.source_name, 200) ?? row.source_name.slice(0, 200),
    external_id: scrubInvalidChars(row.external_id).slice(0, 240),
    url:
      sanitizeUrl(row.url) ??
      scrubInvalidChars(row.url).slice(0, 2048),
    title,
    excerpt: sanitizeText(row.excerpt, 500),
    image_url: sanitizeUrl(row.image_url),
    author: row.author ? sanitizeText(row.author, 200) : null,
    published_at: normalizePublishedAt(row.published_at),
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

  const hiddenKeys = new Set<string>();
  if (normalized.length > 0) {
    const sourceIds = [...new Set(normalized.map((r) => r.source_id))];
    const { data: existingRows } = await supabase
      .from("external_articles")
      .select("source_id, external_id, hidden")
      .in("source_id", sourceIds)
      .eq("hidden", true);
    for (const row of existingRows ?? []) {
      hiddenKeys.add(`${row.source_id}\0${row.external_id}`);
    }
  }

  const merged = normalized.map((row) => {
    const key = `${row.source_id}\0${row.external_id}`;
    if (hiddenKeys.has(key)) return { ...row, hidden: true };
    return row;
  });

  for (let i = 0; i < merged.length; i += CHUNK_SIZE) {
    const chunk = merged.slice(i, i + CHUNK_SIZE);
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
