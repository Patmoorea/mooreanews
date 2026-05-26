"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export function SearchBar({
  variant = "icon",
}: {
  variant?: "icon" | "inline";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
    setQuery("");
  }

  if (variant === "inline") {
    return (
      <form onSubmit={onSubmit} className="relative max-w-2xl w-full">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ocean-400"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un événement, restaurant, annonce…"
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-ocean-200 text-ocean-900 placeholder:text-ocean-400 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200 text-base"
        />
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Rechercher"
        className="p-2 rounded-full text-ocean-700 hover:bg-lagon-100 transition-colors"
      >
        <Search size={20} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-ocean-950/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={() => setIsOpen(false)}
        >
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl relative"
          >
            <Search
              size={22}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-ocean-400"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article, événement, restaurant…"
              className="w-full pl-14 pr-14 py-5 rounded-2xl bg-white border border-ocean-200 text-ocean-900 placeholder:text-ocean-400 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200 text-lg shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-ocean-400 hover:text-ocean-700 hover:bg-ocean-100"
            >
              <X size={18} />
            </button>
            <p className="mt-3 text-xs text-ocean-200">
              Tapez votre recherche et appuyez sur Entrée
            </p>
          </form>
        </div>
      )}
    </>
  );
}
