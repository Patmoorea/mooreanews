"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { PublicationCard } from "@/components/PublicationCard";
import { Badge } from "@/components/ui/Badge";
import type { Article } from "@/lib/content-types";
import { formatDateShortFR, truncate } from "@/lib/utils";

type Props = {
  articles: Article[];
};

export function ArticlesFilter({ articles }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => set.add(a.category));
    return Array.from(set);
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      const corpus = `${a.title} ${a.excerpt} ${a.body} ${
        a.tags?.join(" ") ?? ""
      }`.toLowerCase();
      return corpus.includes(q);
    });
  }, [articles, query, category]);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans les actualités…"
          className="flex-1 px-4 py-3 rounded-full bg-white border border-ocean-200 text-ocean-900 placeholder:text-ocean-400 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={category === "all"}
            onClick={() => setCategory("all")}
          >
            Tout ({articles.length})
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-ocean-600 py-12">
          Aucun article ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <PublicationCard
              key={a.slug}
              href={`/actualites/${a.slug}`}
              title={a.title}
              image={a.image}
              imageAlt={`Affiche — ${a.title}`}
            >
              <div className="flex items-center gap-2 text-xs text-ocean-500 mb-2 flex-wrap">
                {a.featured ? <Badge variant="tiare">À la une</Badge> : null}
                <Badge variant="lagon">{a.category}</Badge>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDateShortFR(a.publishedAt)}
                </span>
              </div>
              <h2 className="font-display text-xl text-ocean-900 leading-tight group-hover:text-tiare-600 transition-colors">
                {a.title}
              </h2>
              <p className="mt-2 text-sm text-ocean-600 line-clamp-3">
                {truncate(a.excerpt, 160)}
              </p>
              {a.author && (
                <p className="mt-3 text-xs text-ocean-500 flex items-center gap-1">
                  <User size={12} />
                  {a.author}
                </p>
              )}
            </PublicationCard>
          ))}
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
        active
          ? "bg-gradient-to-br from-lagon-500 to-ocean-700 text-white shadow-md"
          : "bg-white text-ocean-700 border border-ocean-200 hover:border-tiare-300"
      }`}
    >
      {children}
    </button>
  );
}
