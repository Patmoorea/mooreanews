/**
 * Stripe — boost annonces & premium commerçants.
 */

import Stripe from "stripe";
import { SITE } from "@/lib/constants";

/** Taux EUR→XPF (fixe BCE, arrondi à l’affichage). */
export const EUR_TO_XPF = 119.33;

/** Montants en francs CFP (XPF) — devise zéro décimale côté Stripe. */
export const STRIPE_PRICES = {
  /** ex. 12,50 € */
  announcementBoostXpf: 1500,
  /** ex. 49 € */
  restaurantPremiumXpf: 5900,
  accommodationPremiumXpf: 5900,
  boostDays: 7,
  premiumDays: 30,
} as const;

export function formatXpf(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} XPF`;
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Côté client : boutons paiement visibles si clé publique Stripe définie. */
export function stripePublicEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
}

export function siteBaseUrl(): string {
  return SITE.url.replace(/\/$/, "");
}
