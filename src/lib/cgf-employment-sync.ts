import {
  CGF_JOBS_SOURCE_ID,
  CGF_JOBS_SOURCE_NAME,
  CGF_MOOREA_COMMUNE_SLUGS,
  CGF_OFFERS_URL,
} from "@/lib/employment-sources";
import {
  fetchEmploymentHtml,
  hideStaleEmploymentRows,
  upsertEmploymentRows,
  type EmploymentRow,
} from "@/lib/employment-sync-shared";

const MOOREA_SLUGS = new Set<string>(CGF_MOOREA_COMMUNE_SLUGS);

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse la grille HTML CGF (offres rendues côté serveur). */
export function parseCgfMooreaOffersHtml(html: string): EmploymentRow[] {
  const rows: EmploymentRow[] = [];
  const seen = new Set<string>();
  const chunks = html.split('<article class="single-offres-emploi-grid');

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const communeMatch = chunk.match(/data-commune="([^"]*)"/i);
    const commune = (communeMatch?.[1] ?? "").toLowerCase().trim();
    if (!MOOREA_SLUGS.has(commune)) continue;

    const linkMatch = chunk.match(
      /class="single-offres-emploi-list-title" href="([^"]+)"/i,
    );
    const titleMatch = chunk.match(
      /class="single-offres-emploi-list-title"[^>]*>([\s\S]*?)<\/a>/i,
    );
    if (!linkMatch || !titleMatch) continue;

    const url = linkMatch[1]!.replace(/&amp;/g, "&");
    const title = stripTags(titleMatch[1]!);
    if (!title) continue;

    const refMatch = chunk.match(
      /class="single-offres-emploi-reference"[^>]*>[\s\S]*?(\d{4}-\d+)/i,
    );
    const limitMatch = chunk.match(
      /class="single-offres-emploi-limit-date"[^>]*>[\s\S]*?(\d{2}\/\d{2}\/\d{4})/i,
    );
    const external_id =
      refMatch?.[1] ?? url.replace(/[^a-zA-Z0-9]+/g, "-").slice(-80);
    if (seen.has(external_id)) continue;
    seen.add(external_id);

    const communeLabel =
      commune === "teitorau" ? "Te Ito Rau Moorea-Maiao" : "Moorea-Maiao";
    const excerptParts = [communeLabel];
    if (limitMatch?.[1]) excerptParts.push(`Limite : ${limitMatch[1]}`);

    rows.push({
      external_id,
      url,
      title,
      excerpt: excerptParts.join(" · "),
      published_at: limitMatch?.[1]
        ? parseFrDateToIso(limitMatch[1])
        : new Date().toISOString(),
    });
  }

  return rows;
}

function parseFrDateToIso(dmy: string): string {
  const m = dmy.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return new Date().toISOString();
  const [, d, mo, y] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d)).toISOString();
}

export async function syncCgfMooreaJobs(): Promise<{
  fetched: number;
  upserted: number;
  hidden: number;
}> {
  const html = await fetchEmploymentHtml(CGF_OFFERS_URL);
  const rows = parseCgfMooreaOffersHtml(html);
  const upserted = await upsertEmploymentRows(
    CGF_JOBS_SOURCE_ID,
    CGF_JOBS_SOURCE_NAME,
    rows,
  );
  const hidden =
    rows.length > 0
      ? await hideStaleEmploymentRows(
          CGF_JOBS_SOURCE_ID,
          rows.map((r) => r.external_id),
        )
      : 0;
  return { fetched: rows.length, upserted, hidden };
}
