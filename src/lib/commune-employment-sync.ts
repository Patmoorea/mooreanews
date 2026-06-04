import { fetchRssFeed } from "@/lib/rss-parser";
import {
  COMMUNE_EMPLOI_SOURCE_ID,
  COMMUNE_EMPLOI_SOURCE_NAME,
  COMMUNE_RSS_URL,
} from "@/lib/employment-sources";
import {
  hideStaleEmploymentRows,
  upsertEmploymentRows,
  type EmploymentRow,
} from "@/lib/employment-sync-shared";

const EMPLOI_KEYWORDS =
  /emploi|recrut|concours|stage|apprenti|candidature|poste|vacance|offre/i;

export function communeRssToEmploymentRows(
  items: Awaited<ReturnType<typeof fetchRssFeed>>,
): EmploymentRow[] {
  return items
    .filter((item) => EMPLOI_KEYWORDS.test(`${item.title} ${item.description}`))
    .map((item) => ({
      external_id: item.guid.slice(0, 200),
      url: item.link,
      title: item.title.trim(),
      excerpt:
        item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) ||
        null,
      published_at: item.publishedAt,
    }));
}

export async function syncCommuneEmploymentRss(): Promise<{
  fetched: number;
  upserted: number;
  hidden: number;
}> {
  const items = await fetchRssFeed(COMMUNE_RSS_URL, { fresh: true });
  const rows = communeRssToEmploymentRows(items);
  const upserted = await upsertEmploymentRows(
    COMMUNE_EMPLOI_SOURCE_ID,
    COMMUNE_EMPLOI_SOURCE_NAME,
    rows,
  );
  const hidden =
    rows.length > 0
      ? await hideStaleEmploymentRows(
          COMMUNE_EMPLOI_SOURCE_ID,
          rows.map((r) => r.external_id),
        )
      : 0;
  return { fetched: rows.length, upserted, hidden };
}
