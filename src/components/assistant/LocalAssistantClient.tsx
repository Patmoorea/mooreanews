"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

type Props = {
  initialQuery: string;
  suggestions: string[];
};

export function LocalAssistantClient({ initialQuery, suggestions }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    router.push(`/assistant?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex. médecin, ferry, marché, pharmacie…"
          className="flex-1 rounded-2xl border border-ocean-200 px-4 py-3 text-sm bg-white"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-lagon-600 text-white text-sm font-semibold"
        >
          <Search size={16} />
          Chercher
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => router.push(`/assistant?q=${encodeURIComponent(s)}`)}
            className="text-xs px-3 py-1.5 rounded-full bg-ocean-50 text-ocean-700 hover:bg-lagon-100"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
