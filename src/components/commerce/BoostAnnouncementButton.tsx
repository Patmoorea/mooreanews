"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { stripePublicEnabled } from "@/lib/stripe";

type Props = {
  announcementId: string;
};

export function BoostAnnouncementButton({ announcementId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!stripePublicEnabled()) return null;

  async function onBoost() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout/announcement-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId }),
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
    <div className="mt-6 rounded-2xl border border-soleil-200 bg-gradient-to-br from-soleil-50 to-white p-5">
      <p className="font-display text-lg text-ocean-950 flex items-center gap-2">
        <Sparkles size={18} className="text-soleil-500" />
        Mettre en avant 7 jours
      </p>
      <p className="mt-1 text-sm text-ocean-600">
        Votre annonce apparaît en tête de liste sur MooreaNews (12,50 €).
      </p>
      <button
        type="button"
        onClick={onBoost}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-soleil-400 to-tiare-500 text-white text-sm font-semibold disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Booster mon annonce
      </button>
      {error && <p className="mt-2 text-sm text-tiare-600">{error}</p>}
    </div>
  );
}
