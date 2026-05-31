"use client";

import { useState } from "react";
import { Search, BookOpen, ExternalLink } from "lucide-react";
import type { GuideHit } from "@/lib/local-guide-search";

type Props = {
  initialQuery?: string;
};

export function LocalGuideSearch({ initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GuideHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/guide/search?q=${encodeURIComponent(query.trim())}`,
      );
      const json = (await res.json()) as { results?: GuideHit[] };
      setResults(json.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex. médecin, ferry, pharmacie, marché Pao Pao…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-ocean-200 bg-white text-ocean-900"
            minLength={2}
          />
        </div>
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="px-5 py-3 rounded-2xl bg-lagon-600 text-white font-semibold disabled:opacity-50"
        >
          {loading ? "…" : "Chercher"}
        </button>
      </form>

      <p className="mt-3 text-xs text-ocean-500">
        Réponses tirées de la FAQ et des infos pratiques MooreaNews — pas de
        réponse inventée. Si rien ne correspond, consultez{" "}
        <a href="/contact" className="text-lagon-700 underline">
          Contact
        </a>
        .
      </p>

      {searched && results.length === 0 && !loading && (
        <p className="mt-6 text-sm text-ocean-600">
          Aucune fiche trouvée pour « {query} ». Essayez un autre mot (ferry,
          hôpital, OPT…).
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-6 space-y-3">
          {results.map((r) => (
            <li
              key={`${r.href}-${r.title}`}
              className="rounded-2xl border border-ocean-100 bg-white p-4 hover:border-lagon-200"
            >
              <div className="flex items-start gap-2">
                <BookOpen size={16} className="text-lagon-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold text-ocean-500 tracking-wide">
                    {r.source ?? (r.kind === "faq" ? "FAQ" : "Lien utile")}
                  </p>
                  <a
                    href={r.href}
                    className="font-semibold text-ocean-900 hover:text-lagon-700 inline-flex items-center gap-1"
                  >
                    {r.title}
                    <ExternalLink size={12} className="opacity-50" />
                  </a>
                  <p className="mt-1 text-sm text-ocean-700 line-clamp-3">
                    {r.excerpt}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
