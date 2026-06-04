import { getPublicSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  SEFI_JOBS_SOURCE_ID,
  SEFI_TRAINING_SOURCE_ID,
} from "@/lib/sefi-sources";

export type SefiListing = {
  id: string;
  externalId: string;
  title: string;
  excerpt: string | null;
  url: string;
  publishedAt: string;
  fetchedAt: string;
};

const LISTING_MAX_AGE_DAYS = 120;

function cutoffIso(): string {
  return new Date(
    Date.now() - LISTING_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

async function listBySource(sourceId: string, limit: number): Promise<SefiListing[]> {
  const supabase = getPublicSupabase() ?? getAdminSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("external_articles")
    .select("id, external_id, title, excerpt, url, published_at, fetched_at")
    .eq("source_id", sourceId)
    .eq("hidden", false)
    .gte("published_at", cutoffIso())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    externalId: r.external_id,
    title: r.title,
    excerpt: r.excerpt,
    url: r.url,
    publishedAt: r.published_at,
    fetchedAt: r.fetched_at,
  }));
}

export async function getSefiMooreaJobs(limit = 40): Promise<SefiListing[]> {
  return listBySource(SEFI_JOBS_SOURCE_ID, limit);
}

export async function getSefiMooreaTrainings(limit = 30): Promise<SefiListing[]> {
  return listBySource(SEFI_TRAINING_SOURCE_ID, limit);
}

export async function getSefiLastSyncAt(): Promise<string | null> {
  const supabase = getPublicSupabase() ?? getAdminSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("external_articles")
    .select("fetched_at")
    .in("source_id", [SEFI_JOBS_SOURCE_ID, SEFI_TRAINING_SOURCE_ID])
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.fetched_at ?? null;
}
