"use client";

import { useState } from "react";
import { BedDouble, Loader2 } from "lucide-react";
import { stripePublicEnabled } from "@/lib/stripe";

type Props = {
  accommodationId: string;
  accommodationName: string;
};

export function PremiumAccommodationButton({
  accommodationId,
  accommodationName,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!stripePublicEnabled()) return null;

  async function onPay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout/accommodation-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accommodationId }),
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
    <div className="rounded-2xl border border-soleil-200 bg-soleil-50/60 p-5">
      <p className="font-display text-lg text-ocean-950 flex items-center gap-2">
        <BedDouble size={18} />
        À la une visiteurs — {accommodationName}
      </p>
      <p className="mt-1 text-sm text-ocean-600">
        Top de l&apos;annuaire /visiteurs, badge premium et QR pack hébergeur (~15 000 XPF / 30 j).
      </p>
      <button
        type="button"
        onClick={onPay}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-soleil-500 text-white text-sm font-semibold disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Activer le premium
      </button>
      {error && <p className="mt-2 text-sm text-tiare-600">{error}</p>}
    </div>
  );
}
