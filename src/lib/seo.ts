import type { MetadataRoute } from "next";
import { SITE, RAI_TAHITI } from "@/lib/constants";

/** Origine canonique (www.mooreanews.com en prod). */
export function getSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.mooreanews.com";
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (u.hostname === "mooreanews.com") {
      u.hostname = "www.mooreanews.com";
    }
    return u.origin;
  } catch {
    return "https://www.mooreanews.com";
  }
}

export function absoluteUrl(path: string): string {
  const base = getSiteOrigin();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function googleSiteVerification(): string | undefined {
  return process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;
}

export function bingSiteVerification(): string | undefined {
  return process.env.BING_SITE_VERIFICATION?.trim() || undefined;
}

export function webSiteJsonLd() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "fr-PF",
        publisher: { "@id": `${origin}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${origin}/recherche?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "NewsMediaOrganization",
        "@id": `${origin}/#organization`,
        name: SITE.name,
        url: origin,
        logo: `${origin}/brand/logo.png`,
        sameAs: [
          "https://www.facebook.com/JourdanPatrice/",
          "https://www.instagram.com/mooreanews",
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${origin}/#webpage`,
        url: origin,
        name: `${SITE.name} — ${SITE.tagline}`,
        isPartOf: { "@id": `${origin}/#website` },
        about: {
          "@type": "Place",
          name: "Moorea",
          containedInPlace: {
            "@type": "AdministrativeArea",
            name: "Polynésie française",
          },
        },
      },
      {
        "@type": "MedicalBusiness",
        name: RAI_TAHITI.name,
        url: RAI_TAHITI.siteUrl,
        description: RAI_TAHITI.tagline,
        telephone: `+689 ${RAI_TAHITI.phoneMoorea.replace(/\s/g, "")}`,
        areaServed: ["Moorea", "Tahiti"],
      },
    ],
  };
}

export const STATIC_SITEMAP_PATHS: {
  path: string;
  priority: number;
  freq: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "", priority: 1, freq: "hourly" },
  { path: "/actualites", priority: 0.9, freq: "daily" },
  { path: "/evenements", priority: 0.9, freq: "daily" },
  { path: "/annonces", priority: 0.85, freq: "daily" },
  { path: "/alertes", priority: 0.9, freq: "hourly" },
  { path: "/trafic-ferry", priority: 0.75, freq: "monthly" },
  { path: "/coupures", priority: 0.85, freq: "daily" },
  { path: "/restaurants", priority: 0.85, freq: "weekly" },
  { path: "/ce-soir", priority: 0.8, freq: "daily" },
  { path: "/activites", priority: 0.8, freq: "weekly" },
  { path: "/visiteurs", priority: 0.9, freq: "daily" },
  { path: "/hebergements", priority: 0.85, freq: "weekly" },
  { path: "/mon-sejour", priority: 0.8, freq: "daily" },
  { path: "/guides", priority: 0.75, freq: "monthly" },
  { path: "/guides/ferry-tahiti-moorea", priority: 0.75, freq: "monthly" },
  { path: "/paquebots", priority: 0.8, freq: "daily" },
  { path: "/guides/48h-moorea", priority: 0.75, freq: "monthly" },
  { path: "/visiteurs/pack-hebergeur", priority: 0.5, freq: "monthly" },
  { path: "/vigilance-cyclone", priority: 0.85, freq: "daily" },
  { path: "/infos-pratiques", priority: 0.8, freq: "weekly" },
  { path: "/emploi-formation", priority: 0.85, freq: "daily" },
  { path: "/assistant", priority: 0.7, freq: "monthly" },
  { path: "/signalements", priority: 0.65, freq: "monthly" },
  { path: "/qui-sait-quoi", priority: 0.65, freq: "weekly" },
  { path: "/associations", priority: 0.6, freq: "monthly" },
  { path: "/partenaires", priority: 0.6, freq: "monthly" },
  { path: "/commercant", priority: 0.55, freq: "monthly" },
  { path: "/soumettre", priority: 0.55, freq: "monthly" },
  { path: "/contact", priority: 0.5, freq: "yearly" },
  { path: "/a-propos", priority: 0.5, freq: "yearly" },
  { path: "/telecharger", priority: 0.5, freq: "monthly" },
  { path: "/en", priority: 0.6, freq: "weekly" },
];
