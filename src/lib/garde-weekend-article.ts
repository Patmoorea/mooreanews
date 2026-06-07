/**
 * Crée ou met à jour l'article actualités pour chaque garde week-end Moorea.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";

export function gardeArticleSlug(validFrom: string): string {
  return `garde-moorea-${validFrom}`;
}

function formatDoctorName(name: string): string {
  const n = name.trim();
  return n.startsWith("Dr") ? n : `Dr ${n}`;
}

export function buildGardeArticleTitle(snap: GardeMooreaSnapshot): string {
  return `Garde week-end Moorea — ${snap.label}`;
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
    return `Pharmacie et médecin de garde à Moorea — ${snap.label}. Informations communiquées par la Commune de Moorea-Maiao.`;
  }
  return `${parts.join(" · ")} — garde week-end Moorea (${snap.label}).`;
}

export function buildGardeArticleBody(snap: GardeMooreaSnapshot): string {
  const blocks: string[] = [
    `Informations de garde pour le week-end ${snap.label}, communiquées par la Commune de Moorea-Maiao.`,
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

  if (snap.pharmacy?.name) {
    let phBlock = `Pharmacie de garde : ${snap.pharmacy.name}.`;
    if (snap.pharmacy.phone && snap.pharmacy.phone !== "—") {
      phBlock += ` Téléphone : ${snap.pharmacy.phone}.`;
    }
    blocks.push(phBlock);
  }

  if (snap.pharmacyHours && snap.pharmacyHours.length > 0) {
    const lines = snap.pharmacyHours.map((p) => {
      const sat = p.saturday ? `sam. ${p.saturday}` : "";
      const sun = p.sunday ? `dim. ${p.sunday}` : "";
      const schedule = [sat, sun].filter(Boolean).join(" · ");
      return `${p.district} (${p.phone}) : ${schedule}`;
    });
    blocks.push(`Horaires pharmacies du week-end : ${lines.join(" — ")}.`);
  }

  blocks.push(
    "En cas d'urgence : SAMU 15 · Pompiers 18 · Hôpital Afareaitu 40 55 22 22 · DSP garde 40 47 01 44.",
  );

  if (snap.sourceUrl) {
    blocks.push(`Source officielle : ${snap.sourceUrl}`);
  }

  return blocks.join("\n\n");
}

export async function upsertGardeWeekendArticle(
  snap: GardeMooreaSnapshot,
): Promise<{ slug: string; created: boolean; updated: boolean }> {
  const slug = gardeArticleSlug(snap.validFrom);
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { slug, created: false, updated: false };
  }

  const title = buildGardeArticleTitle(snap).slice(0, 200);
  const excerpt = buildGardeArticleExcerpt(snap).slice(0, 280);
  const body = buildGardeArticleBody(snap);
  const coverUrl = snap.posterImageUrl?.trim() || null;
  const publishedAt = `${snap.validFrom}T06:00:00.000Z`;

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
    tags: ["garde-weekend", "moorea", "commune-moorea"],
    cover_url: coverUrl,
    author: "Commune Moorea-Maiao",
    featured: false,
    published: true,
    published_at: publishedAt,
  };

  if (existing) {
    const { error } = await supabase.from("articles").update(row).eq("slug", slug);
    return { slug, created: false, updated: !error };
  }

  const { error } = await supabase.from("articles").insert(row);
  if (error?.code === "23505") {
    const { error: updateErr } = await supabase.from("articles").update(row).eq("slug", slug);
    return { slug, created: false, updated: !updateErr };
  }

  return { slug, created: !error, updated: false };
}
