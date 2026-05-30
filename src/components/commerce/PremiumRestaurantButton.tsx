"use client";

import { useState } from "react";
import { Store, Loader2 } from "lucide-react";
import { stripePublicEnabled } from "@/lib/stripe";

type Props = {
  restaurantId: string;
  restaurantName: string;
};

export function PremiumRestaurantButton({ restaurantId, restaurantName }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!stripePublicEnabled()) return null;

  async function onPay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout/restaurant-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Paiement indisponible");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-lagon-200 bg-lagon-50/60 p-5">
      <p className="font-display text-lg text-ocean-950 flex items-center gap-2">
        <Store size={18} />
        Premium 30 jours — {restaurantName}
      </p>
      <p className="mt-1 text-sm text-ocean-600">
        Badge « Ouvert maintenant », mise en avant annuaire et menu du jour visible (~15 000 XPF).
      </p>
      <button
        type="button"
        onClick={onPay}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-lagon-600 text-white text-sm font-semibold disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Activer le premium
      </button>
      {error && <p className="mt-2 text-sm text-tiare-600">{error}</p>}
    </div>
  );
}
