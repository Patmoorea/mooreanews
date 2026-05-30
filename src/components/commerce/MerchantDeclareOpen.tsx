"use client";

import { useState } from "react";
import { DoorOpen, DoorClosed, Loader2 } from "lucide-react";

type RestaurantOption = {
  id: string;
  name: string;
};

export function MerchantDeclareOpen({
  restaurants,
}: {
  restaurants: RestaurantOption[];
}) {
  const [email, setEmail] = useState("");
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (restaurants.length === 0) return null;

  async function declare(status: "open" | "closed") {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/commerce/restaurant-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, email, status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Impossible d’enregistrer");
        return;
      }
      setMessage(
        status === "open"
          ? "Statut « ouvert » enregistré pour 12 h."
          : "Statut « fermé » enregistré pour 12 h.",
      );
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-lagon-200 bg-lagon-50/50 p-6 space-y-4">
      <h2 className="font-display text-xl text-ocean-900">
        Déclarer ouvert / fermé (restaurant)
      </h2>
      <p className="text-sm text-ocean-600">
        Votre email doit correspondre à celui enregistré sur votre fiche MooreaNews.
        Valable 12 h — affiché sur le site comme statut confirmé.
      </p>
      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-1">
          Restaurant
        </label>
        <select
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm bg-white"
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-1">
          Email commerçant
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@monrestaurant.pf"
          className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading || !email.trim() || !restaurantId}
          onClick={() => declare("open")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tipanier-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <DoorOpen size={16} />}
          Nous sommes ouverts
        </button>
        <button
          type="button"
          disabled={loading || !email.trim() || !restaurantId}
          onClick={() => declare("closed")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ocean-200 text-ocean-900 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <DoorClosed size={16} />}
          Fermé pour l&apos;instant
        </button>
      </div>
      {message && <p className="text-sm text-tipanier-800">{message}</p>}
      {error && <p className="text-sm text-tiare-700">{error}</p>}
    </div>
  );
}
