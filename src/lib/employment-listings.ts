import { getPublicSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  ALL_EMPLOYMENT_SOURCE_IDS,
  ARAVIHI_JOBS_SOURCE_ID,
  CGF_JOBS_SOURCE_ID,
  COMMUNE_EMPLOI_SOURCE_ID,
  EMPLOYMENT_JOB_SOURCE_IDS,
  SEFI_JOBS_SOURCE_ID,
  SEFI_TRAINING_SOURCE_ID,
} from "@/lib/employment-sources";

export type EmploymentListing = {
  id: string;
  sourceId: string;
  sourceName: string;
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

async function listBySource(
  sourceId: string,
  limit: number,
): Promise<EmploymentListing[]> {
  const supabase = getPublicSupabase() ?? getAdminSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("external_articles")
    .select(
      "id, source_id, source_name, external_id, title, excerpt, url, published_at, fetched_at",
    )
    .eq("source_id", sourceId)
    .eq("hidden", false)
    .gte("published_at", cutoffIso())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    sourceId: r.source_id,
    sourceName: r.source_name,
    externalId: r.external_id,
    title: r.title,
    excerpt: r.excerpt,
    url: r.url,
    publishedAt: r.published_at,
    fetchedAt: r.fetched_at,
  }));
}

export async function getSefiMooreaJobs(limit = 40) {
  return listBySource(SEFI_JOBS_SOURCE_ID, limit);
}

export async function getAravihiMooreaJobs(limit = 40) {
  return listBySource(ARAVIHI_JOBS_SOURCE_ID, limit);
}

export async function getCgfMooreaJobs(limit = 30) {
  return listBySource(CGF_JOBS_SOURCE_ID, limit);
}

export async function getCommuneEmploymentPosts(limit = 15) {
  return listBySource(COMMUNE_EMPLOI_SOURCE_ID, limit);
}

export async function getSefiMooreaTrainings(limit = 30) {
  return listBySource(SEFI_TRAINING_SOURCE_ID, limit);
}

export async function getEmploymentLastSyncAt(): Promise<string | null> {
  const supabase = getPublicSupabase() ?? getAdminSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("external_articles")
    .select("fetched_at")
    .in("source_id", [...ALL_EMPLOYMENT_SOURCE_IDS])
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.fetched_at ?? null;
}

/** Offres récentes pour pastille / bandeau d’accueil (emploi Moorea). */
export async function getRecentMooreaJobOffers(
  limit = 8,
  maxAgeDays = 30,
): Promise<EmploymentListing[]> {
  const supabase = getPublicSupabase() ?? getAdminSupabase();
  if (!supabase) return [];

  const cutoff = new Date(
    Date.now() - maxAgeDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("external_articles")
    .select(
      "id, source_id, source_name, external_id, title, excerpt, url, published_at, fetched_at",
    )
    .in("source_id", [...EMPLOYMENT_JOB_SOURCE_IDS])
    .eq("hidden", false)
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    sourceId: r.source_id,
    sourceName: r.source_name,
    externalId: r.external_id,
    title: r.title,
    excerpt: r.excerpt,
    url: r.url,
    publishedAt: r.published_at,
    fetchedAt: r.fetched_at,
  }));
}
