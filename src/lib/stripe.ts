/**
 * Stripe — boost annonces & premium commerçants.
 */

import Stripe from "stripe";
import { SITE } from "@/lib/constants";

/** Montants en francs CFP (XPF) — devise zéro décimale côté Stripe. */
export const STRIPE_PRICES = {
  announcementBoostXpf: 2000,
  restaurantPremiumXpf: 15000,
  accommodationPremiumXpf: 15000,
  boostDays: 7,
  premiumDays: 30,
} as const;

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
