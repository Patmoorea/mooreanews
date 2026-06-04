/**
 * Veille quotidienne SEFI — offres d'emploi (Moorea) + formations (pages sefi.pf).
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  SEFI_ACTUALITES_URL,
  SEFI_JOBS_SOURCE_ID,
  SEFI_JOBS_SOURCE_NAME,
  SEFI_MOOREA_JOBS_SEARCH_URL,
  SEFI_SERVICES_BASE,
  SEFI_SITE_BASE,
  SEFI_TRAINING_SOURCE_ID,
  SEFI_TRAINING_SOURCE_NAME,
} from "@/lib/employment-sources";
import {
  fetchEmploymentHtml,
  hideStaleEmploymentRows,
  upsertEmploymentRows,
} from "@/lib/employment-sync-shared";

export type SefiSyncResult = {
  jobsFetched: number;
  jobsUpserted: number;
  jobsHidden: number;
  trainingsFetched: number;
  trainingsUpserted: number;
  trainingsHidden: number;
  errors: string[];
};

export type ParsedSefiJob = {
  externalId: string;
  title: string;
  url: string;
  excerpt: string;
  publishedAt: string;
};

export type ParsedSefiTraining = {
  externalId: string;
  title: string;
  url: string;
  excerpt: string;
  publishedAt: string;
};

function parseFrDateToIso(dmy: string): string {
  const m = dmy.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return new Date().toISOString();
  const [, d, mo, y] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d)).toISOString();
}

/** Extrait les offres depuis la page résultats Lotus Notes. */
export function parseSefiJobSearchHtml(html: string): ParsedSefiJob[] {
  const jobs: ParsedSefiJob[] = [];
  const seen = new Set<string>();
  const chunks = html.split("/SefiWeb/SefiOffres.nsf/vOffreWeb/");

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const pathMatch = chunk.match(/^([^"?]+)/);
    const refMatch = chunk.match(/<u>(\d+)\s*:\s*([^<]+)<\/u>/i);
    const dateMatch =
      chunk.match(/D[ée]pos[ée]e le\s*:\s*(\d{2}\/\d{2}\/\d{4})/i) ??
      chunk.match(/(\d{2}\/\d{2}\/\d{4})\s*-\s*Contrat de type/i);
    if (!pathMatch || !refMatch || !dateMatch) continue;

    const externalId = refMatch[1]!.trim();
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    const contractMatch = chunk.match(/Contrat de type\s+([^<]+)/i);
    const lieuMatch = chunk.match(/Lieu\s*:\s*([^<]+)/i);
    const locationLabel =
      lieuMatch?.[1]
        ?.trim()
        .replace(/\s*-\s*A pourvoir.*/i, "")
        .trim() ?? "";
    const contractLabel = contractMatch?.[1]?.trim() ?? "";
    const excerptParts = [
      locationLabel,
      contractLabel ? `Contrat : ${contractLabel}` : "",
    ].filter(Boolean);

    jobs.push({
      externalId,
      title: refMatch[2]!.trim().replace(/\s+/g, " "),
      url: `${SEFI_SERVICES_BASE}/SefiWeb/SefiOffres.nsf/vOffreWeb/${pathMatch[1]}?OpenDocument`,
      excerpt: excerptParts.join(" · "),
      publishedAt: parseFrDateToIso(dateMatch[1]!),
    });
  }

  return jobs;
}

function slugFromEventUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/event\/([^/]+)\/?$/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function titleFromEventSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isMooreaRelated(text: string): boolean {
  return /moorea|moorea-maiao|maiao/i.test(text);
}

/** Formations / ateliers SEFI liés à Moorea (pages /event/…). */
export function parseSefiTrainingLinksHtml(html: string): ParsedSefiTraining[] {
  const trainings: ParsedSefiTraining[] = [];
  const seen = new Set<string>();

  const linkRe = /href="(https:\/\/sefi\.pf\/event\/[^"]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html)) !== null) {
    const url = match[1].replace(/&amp;/g, "&");
    const slug = slugFromEventUrl(url);
    if (!slug || seen.has(slug)) continue;
    if (!isMooreaRelated(slug) && !isMooreaRelated(url)) continue;
    seen.add(slug);

    trainings.push({
      externalId: slug,
      title: titleFromEventSlug(slug),
      url,
      excerpt: "Formation ou atelier SEFI — Moorea",
      publishedAt: new Date().toISOString(),
    });
  }

  return trainings;
}

/** Synchronisation SEFI (emploi privé + formations). */
export async function syncSefiMooreaOpportunities(): Promise<SefiSyncResult> {
  const result: SefiSyncResult = {
    jobsFetched: 0,
    jobsUpserted: 0,
    jobsHidden: 0,
    trainingsFetched: 0,
    trainingsUpserted: 0,
    trainingsHidden: 0,
    errors: [],
  };

  const supabase = getAdminSupabase();
  if (!supabase) {
    result.errors.push("Supabase non configuré");
    return result;
  }

  try {
    const jobsHtml = await fetchEmploymentHtml(SEFI_MOOREA_JOBS_SEARCH_URL);
    const jobs = parseSefiJobSearchHtml(jobsHtml);
    result.jobsFetched = jobs.length;
    result.jobsUpserted = await upsertEmploymentRows(
      SEFI_JOBS_SOURCE_ID,
      SEFI_JOBS_SOURCE_NAME,
      jobs.map((j) => ({
        external_id: j.externalId,
        url: j.url,
        title: j.title,
        excerpt: j.excerpt,
        published_at: j.publishedAt,
      })),
    );
    if (jobs.length > 0) {
      result.jobsHidden = await hideStaleEmploymentRows(
        SEFI_JOBS_SOURCE_ID,
        jobs.map((j) => j.externalId),
      );
    }
  } catch (e) {
    result.errors.push(`offres: ${String(e)}`);
  }

  try {
    const pages = [SEFI_ACTUALITES_URL, `${SEFI_SITE_BASE}/`];
    const allTrainings: ParsedSefiTraining[] = [];
    const seen = new Set<string>();
    for (const pageUrl of pages) {
      const html = await fetchEmploymentHtml(pageUrl);
      for (const t of parseSefiTrainingLinksHtml(html)) {
        if (seen.has(t.externalId)) continue;
        seen.add(t.externalId);
        allTrainings.push(t);
      }
    }
    result.trainingsFetched = allTrainings.length;
    result.trainingsUpserted = await upsertEmploymentRows(
      SEFI_TRAINING_SOURCE_ID,
      SEFI_TRAINING_SOURCE_NAME,
      allTrainings.map((t) => ({
        external_id: t.externalId,
        url: t.url,
        title: t.title,
        excerpt: t.excerpt,
        published_at: t.publishedAt,
      })),
    );
    if (allTrainings.length > 0) {
      result.trainingsHidden = await hideStaleEmploymentRows(
        SEFI_TRAINING_SOURCE_ID,
        allTrainings.map((t) => t.externalId),
      );
    }
  } catch (e) {
    result.errors.push(`formations: ${String(e)}`);
  }

  return result;
}
