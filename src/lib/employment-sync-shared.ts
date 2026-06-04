import { getAdminSupabase } from "@/lib/supabase/admin";

export type EmploymentRow = {
  external_id: string;
  url: string;
  title: string;
  excerpt: string | null;
  published_at: string;
};

export async function upsertEmploymentRows(
  sourceId: string,
  sourceName: string,
  rows: EmploymentRow[],
): Promise<number> {
  const supabase = getAdminSupabase();
  if (!supabase) return 0;
  if (rows.length === 0) return 0;

  const payload = rows.map((r) => ({
    source_id: sourceId,
    source_name: sourceName,
    external_id: r.external_id,
    url: r.url,
    title: r.title.slice(0, 500),
    excerpt: r.excerpt?.slice(0, 500) ?? null,
    image_url: null,
    author: sourceName,
    published_at: r.published_at,
    hidden: false,
    fetched_at: new Date().toISOString(),
  }));

  const { error, count } = await supabase
    .from("external_articles")
    .upsert(payload, { onConflict: "source_id,external_id", count: "exact" });

  if (error) throw new Error(error.message);
  return count ?? payload.length;
}

export async function hideStaleEmploymentRows(
  sourceId: string,
  activeExternalIds: string[],
): Promise<number> {
  const supabase = getAdminSupabase();
  if (!supabase) return 0;

  const { data: existing } = await supabase
    .from("external_articles")
    .select("external_id")
    .eq("source_id", sourceId)
    .eq("hidden", false);

  if (!existing?.length) return 0;

  const active = new Set(activeExternalIds);
  const toHide = existing
    .map((r) => r.external_id)
    .filter((id) => !active.has(id));

  if (toHide.length === 0) return 0;

  const { error } = await supabase
    .from("external_articles")
    .update({ hidden: true })
    .eq("source_id", sourceId)
    .in("external_id", toHide);

  if (error) throw new Error(error.message);
  return toHide.length;
}

export async function fetchEmploymentHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "MooreaNews/1.0 (+https://www.mooreanews.com; veille-emploi-moorea)",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  const buffer = await res.arrayBuffer();
  const ct = res.headers.get("content-type")?.toLowerCase() ?? "";
  if (ct.includes("utf-8")) {
    return new TextDecoder("utf-8").decode(buffer);
  }
  return new TextDecoder("iso-8859-1").decode(buffer);
}
