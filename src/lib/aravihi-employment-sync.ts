import { fetchRssFeed } from "@/lib/rss-parser";
import {
  ARAVIHI_JOBS_SOURCE_ID,
  ARAVIHI_JOBS_SOURCE_NAME,
  ARAVIHI_MOOREA_RSS_URL,
} from "@/lib/employment-sources";
import {
  hideStaleEmploymentRows,
  upsertEmploymentRows,
  type EmploymentRow,
} from "@/lib/employment-sync-shared";

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function externalIdFromItem(link: string, title: string): string {
  const ref = link.match(/offerReference=([^&]+)/i)?.[1];
  if (ref) return ref;
  const idOffre = link.match(/idOffre=(\d+)/i)?.[1];
  if (idOffre) return `offre-${idOffre}`;
  return link.slice(-120);
}

export function rssItemsToEmploymentRows(
  items: Awaited<ReturnType<typeof fetchRssFeed>>,
): EmploymentRow[] {
  return items.map((item) => {
    const excerpt = stripTags(item.description).slice(0, 280) || null;
    const category = item.description.match(/Métier\s*:\s*([^<]+)/i)?.[1];
    return {
      external_id: externalIdFromItem(item.link, item.title),
      url: item.link,
      title: item.title.trim(),
      excerpt: category
        ? `${category.trim()} · ${excerpt ?? ""}`.slice(0, 280)
        : excerpt,
      published_at: item.publishedAt,
    };
  });
}

export async function syncAravihiMooreaJobs(): Promise<{
  fetched: number;
  upserted: number;
  hidden: number;
}> {
  const items = await fetchRssFeed(ARAVIHI_MOOREA_RSS_URL, { fresh: true });
  const rows = rssItemsToEmploymentRows(items);
  const upserted = await upsertEmploymentRows(
    ARAVIHI_JOBS_SOURCE_ID,
    ARAVIHI_JOBS_SOURCE_NAME,
    rows,
  );
  const hidden =
    rows.length > 0
      ? await hideStaleEmploymentRows(
          ARAVIHI_JOBS_SOURCE_ID,
          rows.map((r) => r.external_id),
        )
      : 0;
  return { fetched: rows.length, upserted, hidden };
}
