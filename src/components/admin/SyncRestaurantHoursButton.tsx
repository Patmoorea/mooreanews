"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Check, AlertCircle } from "lucide-react";
import { syncRestaurantHoursFromCatalog } from "@/app/admin/actions";

export function SyncRestaurantHoursButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function onSync() {
    setLoading(true);
    setMessage(null);
    setError(false);
    try {
      const { updated, names } = await syncRestaurantHoursFromCatalog();
      if (updated === 0) {
        setMessage(
          "Aucune mise à jour — horaires déjà en base ou nom absent du catalogue JSON.",
        );
      } else {
        setMessage(
          `${updated} fiche(s) mises à jour : ${names.join(", ")}`,
        );
        router.refresh();
      }
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Échec synchronisation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-ocean-200 bg-ocean-50/80 p-5">
      <p className="font-semibold text-ocean-900 flex items-center gap-2">
        <Clock size={16} />
        Horaires d&apos;ouverture
      </p>
      <p className="mt-1 text-sm text-ocean-700">
        Recopie automatiquement les horaires depuis{" "}
        <code className="text-xs bg-white px-1 rounded">data/restaurants.json</code>{" "}
        vers Supabase (même nom). Affichés sur /restaurants sans Google.
      </p>
      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ocean-700 text-white text-sm font-semibold disabled:opacity-60"
      >
        {loading ? "Synchronisation…" : "Synchroniser les horaires"}
      </button>
      {message && (
        <p
          className={`mt-3 text-sm flex items-center gap-2 ${
            error ? "text-tiare-700" : "text-tipanier-700"
          }`}
        >
          {error ? <AlertCircle size={14} /> : <Check size={14} />}
          {message}
        </p>
      )}
    </div>
  );
}
