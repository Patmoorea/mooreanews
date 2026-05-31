"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";

type PlaceHit = {
  placeId: string;
  name: string;
  address: string;
};

type Props = {
  defaultPlaceId?: string | null;
  restaurantName?: string;
};

export function GooglePlaceIdSearch({
  defaultPlaceId,
  restaurantName,
}: Props) {
  const [query, setQuery] = useState(restaurantName ?? "");
  const [placeId, setPlaceId] = useState(defaultPlaceId ?? "");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSearch() {
    if (query.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setHits([]);
    try {
      const res = await fetch(
        `/api/admin/places/search?q=${encodeURIComponent(query.trim())}`,
      );
      const json = (await res.json()) as {
        places?: PlaceHit[];
        error?: string;
      };
      if (!res.ok) {
        setError(
          json.error ??
            "Recherche impossible — vérifiez GOOGLE_PLACES_API_KEY sur Vercel.",
        );
        return;
      }
      setHits(json.places ?? []);
      if ((json.places ?? []).length === 0) {
        setError("Aucun lieu trouvé — essayez le nom exact + Moorea.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  function pick(hit: PlaceHit) {
    setPlaceId(hit.placeId);
    setHits([]);
    setError(null);
  }

  return (
    <div className="rounded-2xl border border-lagon-200 bg-lagon-50/50 p-4 space-y-3">
      <p className="text-sm font-semibold text-ocean-900">
        Rechercher le lieu sur Google Maps
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex. Snack Mahana Moorea"
          className="flex-1 px-3 py-2 bg-white border border-ocean-200 rounded-lg text-sm"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onSearch())}
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={loading || query.trim().length < 3}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-lagon-600 text-white text-sm font-semibold disabled:opacity-50"
        >
          <Search size={14} />
          {loading ? "…" : "Chercher"}
        </button>
      </div>
      {error && <p className="text-xs text-tiare-700">{error}</p>}
      {hits.length > 0 && (
        <ul className="space-y-1">
          {hits.map((h) => (
            <li key={h.placeId}>
              <button
                type="button"
                onClick={() => pick(h)}
                className="w-full text-left px-3 py-2 rounded-xl bg-white border border-ocean-100 hover:border-lagon-400 text-sm"
              >
                <span className="font-medium text-ocean-900">{h.name}</span>
                <span className="block text-xs text-ocean-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} />
                  {h.address}
                </span>
                <span className="block text-[10px] font-mono text-ocean-400 mt-1">
                  {h.placeId}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="block">
        <span className="block text-xs font-medium text-ocean-700 mb-1">
          Google Place ID (enregistré)
        </span>
        <input
          name="google_place_id"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="ChIJ…"
          className="w-full px-3 py-2 bg-white border border-ocean-200 rounded-lg text-sm font-mono"
        />
      </label>
      <p className="text-xs text-ocean-600">
        Nécessite <code className="bg-white px-1 rounded">GOOGLE_PLACES_API_KEY</code>{" "}
        sur Vercel. Voir <code>docs/GOOGLE-PLACES-SETUP.md</code>.
      </p>
    </div>
  );
}
