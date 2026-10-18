/**
 * Crée ou met à jour l'article actualités pour chaque garde week-end Moorea.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import {
  mergeGardeSnapshotForDisplay,
  readGardeFileSnapshot,
} from "@/lib/garde-moorea-data";
import { GARDE_ARTICLE_AUTHOR, GARDE_POSTER_CREDIT, isPlausibleGardeDates } from "@/lib/garde-cleanup";
import { weekendPharmacyHoursParagraph } from "@/data/pharmacies-moorea";
import { renderAndUploadMooreaNewsGardePoster } from "@/lib/garde-weekend-poster-sync";
import { SITE } from "@/lib/constants";

export function gardeArticleSlug(validFrom: string): string {
  return `garde-moorea-${validFrom}`;
}

function formatDoctorName(name: string): string {
  const n = name.trim();
  return n.startsWith("Dr") ? n : `Dr ${n}`;
}

export function buildGardeArticleTitle(snap: GardeMooreaSnapshot): string {
  const label = snap.label?.includes("->")
    ? `Samedi ${snap.validFrom.slice(8, 10)} / Dimanche ${snap.validTo.slice(8, 10)}`
    : snap.label;
  return `Garde week-end Moorea — ${label}`;
}

async function resolveGardeArticleCoverUrl(
  snap: GardeMooreaSnapshot,
): Promise<string> {
  // Image générée aux couleurs de MooreaNews avec les données vérifiées.
  // Jamais le tableau COPPF de toute la Polynésie (ancienne « image pourrie »).
  const uploaded = await renderAndUploadMooreaNewsGardePoster(snap);
  if (uploaded?.startsWith("http")) {
    const sep = uploaded.includes("?") ? "&" : "?";
    return `${uploaded}${sep}v=${encodeURIComponent(snap.doctor?.phone?.replace(/\D/g, "") || snap.syncedAt.slice(0, 10))}`;
  }
  return `${SITE.url.replace(/\/$/, "")}/api/garde-weekend/poster/${snap.validFrom}`;
}

export function buildGardeArticleExcerpt(snap: GardeMooreaSnapshot): string {
  const parts: string[] = [];
  if (snap.doctor?.name) {
    parts.push(formatDoctorName(snap.doctor.name));
  }
  if (snap.doctor?.phone && snap.doctor.phone !== "—") {
    parts.push(snap.doctor.phone);
  }
  if (parts.length === 0) {
    return `Pharmacie et médecin de garde à Moorea — ${snap.label}. Source : tour de garde officiel de l'Ordre des médecins de Polynésie française.`;
  }
  return `${parts.join(" · ")} — garde week-end Moorea (${snap.label}).`;
}

export function buildGardeArticleBody(snap: GardeMooreaSnapshot): string {
  const blocks: string[] = [
    `Informations de garde pour le week-end ${snap.label}, d'après le tour de garde officiel des médecins généralistes (Conseil de l'Ordre des médecins de Polynésie française).`,
  ];

  if (snap.doctor?.name) {
    let doctorBlock = `Médecin de garde : ${formatDoctorName(snap.doctor.name)}.`;
    if (snap.doctorAddress) {
      doctorBlock += ` Lieu : ${snap.doctorAddress}.`;
    }
    if (snap.doctorHours?.saturday || snap.doctorHours?.sunday) {
      const hours: string[] = [];
      if (snap.doctorHours.saturday) hours.push(`samedi ${snap.doctorHours.saturday}`);
      if (snap.doctorHours.sunday) hours.push(`dimanche ${snap.doctorHours.sunday}`);
      doctorBlock += ` Horaires : ${hours.join(", ")}.`;
    }
    if (snap.doctor.phone && snap.doctor.phone !== "—") {
      doctorBlock += ` Téléphone : ${snap.doctor.phone}.`;
    }
    blocks.push(doctorBlock);
  }

  const duty = snap.pharmacyDuty;
  const dutyMatchesWeekend =
    duty != null &&
    duty.validFrom === snap.validFrom &&
    duty.validTo === snap.validTo &&
    Boolean(duty.name);
  if (dutyMatchesWeekend && duty) {
    let phBlock = `Pharmacie de garde : ${duty.name}.`;
    if (duty.phone && duty.phone !== "—") {
      phBlock += ` Téléphone : ${duty.phone}.`;
    }
    phBlock += ` Source : ${duty.sourceLabel}.`;
    blocks.push(phBlock);
  }

  const weekendHours = weekendPharmacyHoursParagraph();
  if (weekendHours) blocks.push(weekendHours);

  blocks.push(
    "En cas d'urgence : SAMU 15 · Pompiers 18 · Hôpital Afareaitu 40 55 22 22 · DSP garde 40 47 01 44.",
  );

  blocks.push(GARDE_POSTER_CREDIT);

  if (snap.sourceUrl) {
    blocks.push(`Source officielle : ${snap.sourceUrl}`);
  }

  return blocks.join("\n\n");
}

/** Met à jour les articles Facebook garde récents avec le même contenu que l'article officiel. */
export async function repairMooreaNewsGardeFbArticles(
  snap: GardeMooreaSnapshot,
  coverUrl: string,
): Promise<number> {
  const supabase = getAdminSupabase();
  if (!supabase) return 0;

  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, body")
    .like("slug", "mooreanews-fb-%")
    .gte("published_at", since)
    .eq("published", true);

  const title = buildGardeArticleTitle(snap);
  const excerpt = buildGardeArticleExcerpt(snap);
  const body = buildGardeArticleBody(snap);
  let repaired = 0;

  for (const row of data ?? []) {
    const corpus = `${row.title} ${row.body}`.toLowerCase();
    if (!/garde|medecin|médecin|pharmacie|week[- ]?end/.test(corpus)) continue;

    const { error } = await supabase
      .from("articles")
      .update({
        title: title.slice(0, 500),
        excerpt,
        body,
        cover_url: coverUrl,
        category: "sante",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (!error) repaired += 1;
  }

  return repaired;
}

export async function upsertGardeWeekendArticle(
  snap: GardeMooreaSnapshot,
): Promise<{
  slug: string;
  created: boolean;
  updated: boolean;
  error?: string;
  fbRepaired?: number;
}> {
  const slug = gardeArticleSlug(snap.validFrom);
  if (!isPlausibleGardeDates(snap.validFrom, snap.validTo, new Date())) {
    return { slug, created: false, updated: false, error: `dates invraisemblables ${snap.validFrom}/${snap.validTo}` };
  }
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { slug, created: false, updated: false, error: "supabase_admin_missing" };
  }

  const file = await readGardeFileSnapshot();
  const merged = mergeGardeSnapshotForDisplay(
    snap,
    file?.validFrom === snap.validFrom ? file : null,
  );

  const title = buildGardeArticleTitle(merged).slice(0, 200);
  const excerpt = buildGardeArticleExcerpt(merged).slice(0, 280);
  const body = buildGardeArticleBody(merged);
  const coverUrl = await resolveGardeArticleCoverUrl(merged);
  const publishedAt = `${merged.validFrom}T06:00:00.000Z`;

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const row = {
    slug,
    title,
    excerpt,
    body,
    category: "sante",
    tags: ["garde-weekend", "moorea", "ordre-medecins"],
    cover_url: coverUrl,
    author: GARDE_ARTICLE_AUTHOR,
    featured: false,
    published: true,
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };

  let created = false;
  let updated = false;
  let error: string | undefined;

  if (existing) {
    const { error: updErr } = await supabase.from("articles").update(row).eq("slug", slug);
    updated = !updErr;
    error = updErr?.message;
  } else {
    const { error: insErr } = await supabase.from("articles").insert(row);
    if (insErr?.code === "23505") {
      const { error: updErr } = await supabase.from("articles").update(row).eq("slug", slug);
      updated = !updErr;
      error = updErr?.message;
    } else {
      created = !insErr;
      error = insErr?.message;
    }
  }

  const fbRepaired = await repairMooreaNewsGardeFbArticles(merged, coverUrl);

  return { slug, created, updated, error, fbRepaired };
}
