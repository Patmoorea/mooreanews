"use client";

import { useState } from "react";
import { BedDouble, Loader2 } from "lucide-react";
import type { AvailabilityStatus } from "@/lib/accommodations";

const AVAIL_LABELS: Record<AvailabilityStatus, string> = {
  available: "Disponible",
  limited: "Places limitées",
  contact: "Contacter pour dispo",
  full: "Complet",
};

type AccommodationOption = {
  id: string;
  name: string;
};

const STATUSES: AvailabilityStatus[] = [
  "available",
  "limited",
  "contact",
  "full",
];

export function MerchantDeclareAccommodation({
  accommodations,
}: {
  accommodations: AccommodationOption[];
}) {
  const [email, setEmail] = useState("");
  const [accommodationId, setAccommodationId] = useState(
    accommodations[0]?.id ?? "",
  );
  const [status, setStatus] = useState<AvailabilityStatus>("available");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (accommodations.length === 0) return null;

  async function submit() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/commerce/accommodation-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accommodationId, email, status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Impossible d'enregistrer");
        return;
      }
      setMessage(
        `Disponibilité « ${AVAIL_LABELS[status]} » enregistrée pour 48 h.`,
      );
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-soleil-200 bg-soleil-50/50 p-6 space-y-4">
      <h2 className="font-display text-xl text-ocean-900 flex items-center gap-2">
        <BedDouble size={20} />
        Mettre à jour la disponibilité (hébergement)
      </h2>
      <p className="text-sm text-ocean-600">
        Votre email doit correspondre à celui enregistré sur votre fiche MooreaNews.
        Affiché sur /hebergements pendant 48 h.
      </p>
      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-1">
          Hébergement
        </label>
        <select
          value={accommodationId}
          onChange={(e) => setAccommodationId(e.target.value)}
          className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm bg-white"
        >
          {accommodations.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-1">
          Email hébergeur
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@mapension.pf"
          className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-1">
          Disponibilité
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
          className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {AVAIL_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={loading || !email.trim() || !accommodationId}
        onClick={submit}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-soleil-600 text-white text-sm font-semibold disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Enregistrer la disponibilité
      </button>
      {message && <p className="text-sm text-tipanier-800">{message}</p>}
      {error && <p className="text-sm text-tiare-700">{error}</p>}
    </div>
  );
}
