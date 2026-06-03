/**
 * Données structurées schema.org/Event (Search Console / Google).
 */

import type { Event } from "@/lib/content-types";
import { isPlaceholderContentImage } from "@/lib/cover-image";
import { SITE } from "@/lib/constants";
import { absoluteUrl, getSiteOrigin } from "@/lib/seo";

/** Extrait un montant XPF numérique pour schema.org/Offer.price */
export function parseEventPriceXpf(price?: string): number {
  if (!price?.trim()) return 0;
  const lower = price.toLowerCase();
  if (/gratuit|libre|free|offert/.test(lower)) return 0;
  const match = price.replace(/\u00a0/g, " ").match(/(\d[\d\s.,]*)/);
  if (!match) return 0;
  const digits = match[1].replace(/[\s.,]/g, "");
  const n = Number(digits);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function eventImageAbsolute(image?: string): string {
  const trimmed = image?.trim();
  if (trimmed && !isPlaceholderContentImage(trimmed)) {
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return absoluteUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  }
  return absoluteUrl("/opengraph-image");
}

function organizerUrl(event: Event): string {
  const u = event.url?.trim();
  if (u && /^https?:\/\//i.test(u)) return u;
  return getSiteOrigin();
}

/** JSON-LD Event conforme aux champs requis par Google. */
export function buildEventJsonLd(event: Event, pageUrl: string) {
  const organizerName = event.organizer?.trim() || SITE.name;
  const price = parseEventPriceXpf(event.price);
  const validFrom = `${event.date}T00:00:00-10:00`;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    image: [eventImageAbsolute(event.image)],
    startDate: event.time ? `${event.date}T${event.time}:00-10:00` : event.date,
    endDate: event.endDate ?? event.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: pageUrl,
    location: {
      "@type": "Place",
      name: event.location,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.district ?? "Moorea",
        addressRegion: "Polynésie française",
        addressCountry: "PF",
      },
    },
    performer: {
      "@type": "Organization",
      name: organizerName,
    },
    organizer: {
      "@type": "Organization",
      name: organizerName,
      url: organizerUrl(event),
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      price,
      priceCurrency: "XPF",
      availability: "https://schema.org/InStock",
      validFrom,
    },
  };
}
