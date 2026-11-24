"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/layout/SearchBar";

type SearchHit = {
  type: "article" | "event" | "annonce" | "restaurant" | "activite" | "info";
  href: string;
  title: string;
  excerpt: string;
  badge: string;
};

const BADGE_VARIANTS = {
  article: "lagon",
  event: "tiare",
  annonce: "soleil",
  restaurant: "couchant",
  activite: "tipanier",
  info: "ocean",
} as const;

function Results({ query }: { query: string }) {
  const [payload, setPayload] = useState<{ query: string; results: SearchHit[] } | null>(
    null,
  );

  useEffect(() => {
    if (query.length < 2) return;
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json() as Promise<{ results: SearchHit[] }>)
      .then((data) => {
        if (!cancelled) setPayload({ query, results: data.results ?? [] });
      })
      .catch(() => {
        if (!cancelled) setPayload({ query, results: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const results = payload?.query === query ? payload.results : null;

  if (!query) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-lagon-50 to-tiare-50 p-8 text-center">
        <Search size={42} className="mx-auto text-lagon-500 mb-3" />
        <h2 className="font-display text-xl text-ocean-900">
          Recherchez dans tout le contenu
        </h2>
        <p className="mt-2 text-ocean-700 max-w-md mx-auto">
          Articles, événements, annonces, restaurants, activités, infos pratiques — tout
          est indexé.
        </p>
      </div>
    );
  }

  if (results === null) {
    return <p className="text-center text-ocean-600">Recherche…</p>;
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4 inline-block animate-wave">🏝️</div>
        <p className="text-ocean-700">
          Aucun résultat pour <strong>« {query} »</strong>
        </p>
        <p className="mt-2 text-sm text-ocean-500">
          Essayez avec un mot-clé plus court ou une autre orthographe.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {results.map((r) => (
        <li key={`${r.type}-${r.href}`}>
          <Link
            href={r.href}
            className="block bg-white rounded-2xl border border-ocean-100 p-5 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Badge variant={BADGE_VARIANTS[r.type]}>{r.badge}</Badge>
                <h3 className="mt-2 font-display text-lg text-ocean-900">{r.title}</h3>
                <p className="mt-1 text-sm text-ocean-600 line-clamp-2">{r.excerpt}</p>
              </div>
              <ArrowRight size={18} className="text-ocean-400 flex-shrink-0 mt-1" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function QueryResults() {
  const params = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  return <Results query={query} />;
}

export function RechercheClient() {
  return (
    <>
      <Container className="py-10 sm:py-12">
        <SearchBar variant="inline" />
      </Container>
      <Container className="pb-16">
        <Suspense fallback={<Results query="" />}>
          <QueryResults />
        </Suspense>
      </Container>
    </>
  );
}
