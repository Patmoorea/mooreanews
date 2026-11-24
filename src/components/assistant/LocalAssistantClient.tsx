"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

type Hit = {
  kind: "faq" | "info";
  title: string;
  excerpt: string;
  href: string;
};

type Props = {
  suggestions: string[];
};

function AssistantBody({
  suggestions,
  query,
}: Props & { query: string }) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [payload, setPayload] = useState<{ query: string; hits: Hit[] } | null>(null);

  useEffect(() => {
    if (query.length < 2) return;
    let cancelled = false;
    fetch(`/api/assistant/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json() as Promise<{ hits: Hit[] }>)
      .then((data) => {
        if (!cancelled) setPayload({ query, hits: data.hits ?? [] });
      })
      .catch(() => {
        if (!cancelled) setPayload({ query, hits: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const hits = payload?.query === query ? payload.hits : null;

  function go(next: string) {
    const trimmed = next.trim();
    if (trimmed.length < 2) return;
    router.push(`/assistant?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="flex gap-2"
      >
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
            onClick={() => go(s)}
            className="text-xs px-3 py-1.5 rounded-full bg-ocean-50 text-ocean-700 hover:bg-lagon-100"
          >
            {s}
          </button>
        ))}
      </div>

      {query.length >= 2 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-ocean-950 mb-4">
            {hits === null
              ? `Recherche « ${query} »…`
              : hits.length > 0
                ? `${hits.length} résultat(s) pour « ${query} »`
                : `Aucune fiche pour « ${query} »`}
          </h2>
          {hits !== null && hits.length === 0 ? (
            <p className="text-sm text-ocean-600">
              Essayez un autre mot-clé, consultez{" "}
              <Link href="/qui-sait-quoi" className="text-lagon-700 font-semibold hover:underline">
                Qui sait quoi
              </Link>{" "}
              ou{" "}
              <Link href="/infos-pratiques" className="text-lagon-700 font-semibold hover:underline">
                Infos pratiques
              </Link>
              . Vous pouvez aussi{" "}
              <Link href="/signalements" className="text-lagon-700 font-semibold hover:underline">
                signaler une info
              </Link>
              .
            </p>
          ) : null}
          {hits && hits.length > 0 ? (
            <ul className="space-y-3">
              {hits.map((h) => (
                <li key={`${h.kind}-${h.href}`}>
                  <Link
                    href={h.href}
                    className="block rounded-2xl border border-ocean-100 bg-white p-4 hover:border-lagon-300 transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase text-ocean-500">
                      {h.kind === "faq" ? "FAQ" : "Info pratique"}
                    </span>
                    <p className="font-semibold text-ocean-900 mt-1">{h.title}</p>
                    <p className="text-sm text-ocean-600 mt-1 line-clamp-2">{h.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}
    </div>
  );
}

function WithQuery({ suggestions }: Props) {
  const params = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  return <AssistantBody key={query} suggestions={suggestions} query={query} />;
}

export function LocalAssistantClient({ suggestions }: Props) {
  return (
    <Suspense fallback={<AssistantBody suggestions={suggestions} query="" />}>
      <WithQuery suggestions={suggestions} />
    </Suspense>
  );
}
