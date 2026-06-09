import type { MetadataRoute } from "next";
import type { Metadata } from "next";
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

/** URL absolue pour Open Graph / Twitter (chemins relatifs → www). */
export function toAbsoluteMediaUrl(
  url: string | null | undefined,
): string | undefined {
  const u = url?.trim();
  if (!u) return undefined;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return absoluteUrl(u);
}

type ShareMetadataInput = {
  title: string;
  description: string;
  path: string;
  imageUrl?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  tags?: string[];
};

/** Open Graph + Twitter cohérents pour le partage social (Facebook, WhatsApp, X). */
export function buildPageShareMetadata(input: ShareMetadataInput): Metadata {
  const canonical = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const absImage = toAbsoluteMediaUrl(input.imageUrl);
  const ogImages = absImage
    ? [{ url: absImage, alt: input.title }]
    : undefined;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      title: input.title,
      description: input.description,
      type: input.type ?? "website",
      url: absoluteUrl(canonical),
      ...(ogImages ? { images: ogImages } : {}),
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.authors?.length ? { authors: input.authors } : {}),
      ...(input.tags?.length ? { tags: input.tags } : {}),
    },
    twitter: {
      card: absImage ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      ...(absImage ? { images: [absImage] } : {}),
    },
  };
}

export function faqPageJsonLd(
  entries: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: e.answer,
      },
    })),
  };
}

export function lodgingBusinessJsonLd(input: {
  name: string;
  description: string;
  slug: string;
  district: string;
  website?: string | null;
  telephone?: string | null;
  imageUrl?: string | null;
}) {
  const url = absoluteUrl(`/hebergements/${input.slug}`);
  const image = toAbsoluteMediaUrl(input.imageUrl);
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: input.name,
    description: input.description,
    url,
    ...(image ? { image } : {}),
    ...(input.website ? { sameAs: input.website } : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: input.district,
      addressRegion: "Moorea",
      addressCountry: "PF",
    },
  };
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
          "https://www.facebook.com/MooreaNews",
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
  { path: "/paquebots", priority: 0.8, freq: "monthly" },
  { path: "/guides/48h-moorea", priority: 0.75, freq: "monthly" },
  { path: "/visiteurs/pack-hebergeur", priority: 0.5, freq: "monthly" },
  { path: "/vigilance-cyclone", priority: 0.85, freq: "daily" },
  { path: "/infos-pratiques", priority: 0.8, freq: "weekly" },
  { path: "/sante-garde", priority: 0.88, freq: "daily" },
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

/** Metadata SEO pour pages statiques (canonical + OG). */
export function staticPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const canonical = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: absoluteUrl(canonical),
      siteName: SITE.name,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
    ...(opts.index === false
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

/** Metadata SEO pour pages liste (canonical + OG + RSS optionnel). */
export function listingPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  rssPath?: string;
}): Metadata {
  const canonical = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical,
      ...(opts.rssPath
        ? { types: { "application/rss+xml": opts.rssPath } }
        : {}),
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: absoluteUrl(canonical),
      siteName: SITE.name,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
  };
}

/** JSON-LD NewsArticle complet (Google Discover / News). */
export function newsArticleJsonLd(article: {
  title: string;
  excerpt: string;
  body: string;
  slug: string;
  publishedAt: string;
  author?: string;
  tags?: string[];
  imageUrl?: string | null;
}) {
  const url = absoluteUrl(`/actualites/${article.slug}`);
  const image =
    article.imageUrl?.trim().startsWith("http")
      ? article.imageUrl.trim()
      : article.imageUrl?.trim()
        ? absoluteUrl(article.imageUrl.trim())
        : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    url,
    inLanguage: "fr-PF",
    author: article.author
      ? { "@type": "Person", name: article.author }
      : { "@type": "Organization", name: SITE.name },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(SITE.logo),
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(image ? { image: [image] } : {}),
    articleBody: article.body.slice(0, 8000),
    keywords: article.tags?.join(", "),
  };
}
