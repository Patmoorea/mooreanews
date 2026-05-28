import infoData from "@/../data/info-pratiques.json";
import type { InfoPratique } from "@/lib/content-types";

const JSON_CATALOG = infoData as InfoPratique[];

export function normalizeInfoTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * Fusionne Supabase + catalogue JSON : le JSON fournit les slugs stables
 * (/infos-pratiques/rai-tahiti-vsl) même quand la base utilise des UUID.
 */
export function mergeInfoPratiqueCatalog(
  dbItems: InfoPratique[],
  json: InfoPratique[] = JSON_CATALOG,
): InfoPratique[] {
  const merged = new Map<string, InfoPratique>();

  for (const entry of json) {
    merged.set(normalizeInfoTitle(entry.title), { ...entry });
  }

  for (const entry of dbItems) {
    const key = normalizeInfoTitle(entry.title);
    const fromJson = merged.get(key);
    if (fromJson) {
      merged.set(key, {
        ...fromJson,
        ...entry,
        slug: fromJson.slug,
        title: entry.title || fromJson.title,
        description: entry.description || fromJson.description,
        category: entry.category,
        address: entry.address ?? fromJson.address,
        phone: entry.phone ?? fromJson.phone,
        hours: entry.hours ?? fromJson.hours,
        website: entry.website ?? fromJson.website,
        image: entry.image ?? fromJson.image,
      });
    } else {
      merged.set(key, entry);
    }
  }

  return [...merged.values()];
}

export function getJsonInfoCatalog(): InfoPratique[] {
  return JSON_CATALOG.slice();
}

export const RAI_TAHITI_INFO: InfoPratique =
  JSON_CATALOG.find((i) => i.slug === "rai-tahiti-vsl") ?? {
    slug: "rai-tahiti-vsl",
    title: "RAI TAHITI — Transport sanitaire (VSL)",
    description:
      "Transport médical VSL conventionné CPS entre Moorea et Tahiti. Disponible 7j/7, base à Pihaena (Moorea).",
    category: "transport",
    address: "PK 14,5 côté montagne, Pihaena",
    lat: -17.5185,
    lon: -149.772,
    phone: "89 77 76 24",
    hours: "7j/7 — Moorea : 89 77 76 24 · Tahiti : 89 41 02 10",
    website: "https://raitahiti.com",
  };
