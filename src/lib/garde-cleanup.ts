/**
 * Garde-fous et nettoyage des articles garde (exécuté à chaque sync garde).
 * - Refuse les dates invraisemblables (ex. « Jour férié 12 septembre 2028 »).
 * - Signature normale du site (« MooreaNews ») au lieu de « Commune Moorea-Maiao ».
 * - Retire les numéros de pharmacies non vérifiés des articles et des infos pratiques.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { tahitiHolidayLabel } from "@/lib/tahiti-holidays";

export const GARDE_ARTICLE_AUTHOR = "MooreaNews";

/** Fiches infos pratiques non vérifiées (numéros absents de toute source officielle). */
export const UNVERIFIED_PHARMACY_INFO_TITLES = ["Pharmacie Tran — Paopao", "Pharmacie Moorea Haapiti"];

const DAY = 86400_000;

/** Articles déjà supprimés de la base dont la page ISR doit être purgée. */
export const PURGED_GARDE_SLUGS = ["garde-moorea-2028-09-12"];

/** Une garde n'est publiable que pour le passé proche ou les 2 semaines à venir. */
export function isPlausibleGardeDates(validFrom: string, validTo: string, now: Date): boolean {
  const from = Date.parse(`${validFrom}T12:00:00Z`);
  const to = Date.parse(`${validTo}T12:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from || to - from > 4 * DAY) return false;
  if (from > now.getTime() + 14 * DAY) return false;
  if (to < now.getTime() - 60 * DAY) return false;
  if (validFrom === validTo) {
    const d = new Date(from);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6 && !tahitiHolidayLabel(new Date(`${validFrom}T12:00:00-10:00`))) {
      return false;
    }
  }
  return true;
}

/** Date de garde portée par un slug d'article garde. */
export function gardeDateFromSlug(slug: string): string | null {
  return slug.match(/^garde-moorea-(\d{4}-\d{2}-\d{2})$/)?.[1] ?? null;
}

/** Retire le paragraphe « Horaires pharmacies du week-end : … » (numéros non vérifiés). */
export function stripUnverifiedPharmacyParagraph(body: string): string {
  return body
    .split(/\n{2,}/)
    .filter((p) => !/^Horaires pharmacies du week-end\s*:/.test(p.trim()))
    .filter((p) => !/^Pharmacie de garde\s*:\s*Pharmacies Moorea/.test(p.trim()))
    .join("\n\n");
}

export function stripCommuneMention(body: string): string {
  return body
    .replace(/, communiquées par la Commune de Moorea-Maiao\./g, ", d'après le tour de garde officiel des médecins généralistes (Conseil de l'Ordre des médecins de Polynésie française).")
    .replace(/Affiche MooreaNews générée à partir des informations officielles de la commune\./g, "Image MooreaNews générée à partir du tour de garde officiel.");
}

export type GardeCleanupReport = {
  deletedArticles: string[];
  deletedMedia: string[];
  fixedArticles: number;
  deletedInfo: number;
  /** Slugs modifiés ou supprimés (à revalider côté Vercel). */
  touchedSlugs: string[];
  errors: string[];
};

export async function cleanupGardeData(
  supabase: SupabaseClient,
  now = new Date(),
): Promise<GardeCleanupReport> {
  const report: GardeCleanupReport = {
    deletedArticles: [],
    deletedMedia: [],
    fixedArticles: 0,
    deletedInfo: 0,
    touchedSlugs: [],
    errors: [],
  };

  const { data: rows, error } = await supabase
    .from("articles")
    .select("slug, author, body, tags")
    // Inclut les copies importées (mooreanews-fb-*) dont le titre est « Garde week-end Moorea … ».
    .or("slug.like.garde-moorea-%,tags.cs.{garde-weekend},title.ilike.Garde week-end Moorea%");
  if (error) {
    report.errors.push(error.message);
    return report;
  }

  for (const row of rows ?? []) {
    const date = gardeDateFromSlug(row.slug as string);
    if (date && !isPlausibleGardeDates(date, date, now) && Date.parse(date) > now.getTime()) {
      const { error: delErr } = await supabase.from("articles").delete().eq("slug", row.slug);
      if (delErr) {
        report.errors.push(delErr.message);
        continue;
      }
      report.deletedArticles.push(row.slug as string);
      report.touchedSlugs.push(row.slug as string);
      const paths = [
        `facebook-import/garde-commune-${date}.jpg`,
        `generated/garde-weekend/garde-moorea-${date}.png`,
      ];
      const { error: rmErr } = await supabase.storage.from("media").remove(paths);
      if (rmErr) report.errors.push(rmErr.message);
      else report.deletedMedia.push(...paths);
      continue;
    }

    const body = (row.body as string) ?? "";
    const newBody = stripCommuneMention(stripUnverifiedPharmacyParagraph(body));
    const tags = ((row.tags as string[]) ?? []).map((t) => (t === "commune-moorea" ? "ordre-medecins" : t));
    const needsAuthor = row.author === "Commune Moorea-Maiao";
    if (newBody !== body || needsAuthor || tags.join() !== ((row.tags as string[]) ?? []).join()) {
      const { error: updErr } = await supabase
        .from("articles")
        .update({ body: newBody, author: GARDE_ARTICLE_AUTHOR, tags })
        .eq("slug", row.slug);
      if (updErr) report.errors.push(updErr.message);
      else {
        report.fixedArticles++;
        report.touchedSlugs.push(row.slug as string);
      }
    }
  }

  const { data: del, error: infoErr } = await supabase
    .from("info_pratiques")
    .delete()
    .in("title", UNVERIFIED_PHARMACY_INFO_TITLES)
    .select("title");
  if (infoErr) report.errors.push(infoErr.message);
  else report.deletedInfo = del?.length ?? 0;

  return report;
}
