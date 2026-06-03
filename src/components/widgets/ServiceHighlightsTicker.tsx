"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Droplets, Anchor } from "lucide-react";
import type { HomeHighlight } from "@/lib/home-highlights";

type HighlightItem = HomeHighlight & {
  icon: React.ReactNode;
};

function highlightIcon(kind: HomeHighlight["kind"]) {
  switch (kind) {
    case "coupure_edt":
      return <Zap size={14} className="text-soleil-200 shrink-0" />;
    case "coupure_eau":
      return <Droplets size={14} className="text-lagon-200 shrink-0" />;
    case "paquebot":
      return <Anchor size={14} className="text-white shrink-0" />;
  }
}

function toItems(highlights: HomeHighlight[]): HighlightItem[] {
  return highlights.map((h) => ({
    ...h,
    icon: highlightIcon(h.kind),
  }));
}

function HighlightRow({ item }: { item: HighlightItem }) {
  return (
    <Link
      href={item.href}
      className="inline-flex items-center gap-2 hover:text-white hover:underline underline-offset-2"
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

/**
 * Bandeau dédié : coupures eau/électricité et paquebots croisière uniquement.
 * Fixe si une seule annonce, défilant si plusieurs.
 */
export function ServiceHighlightsTicker() {
  const [items, setItems] = useState<HighlightItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/home-highlights", { cache: "no-store" });
        if (!res.ok) return;
        const { highlights } = (await res.json()) as {
          highlights: HomeHighlight[];
        };
        if (!cancelled) setItems(toItems(highlights ?? []));
      } catch {
        // silencieux
      }
    }

    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (items.length === 0) return null;

  const single = items.length === 1;

  return (
    <div
      role="region"
      aria-label="Coupures et paquebots"
      className="relative z-30 overflow-hidden bg-gradient-to-r from-amber-950 via-orange-900 to-amber-950 text-amber-50 border-b border-amber-800/80"
    >
      {single ? (
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-center">
          <HighlightRow item={items[0]} />
        </div>
      ) : (
        <div className="flex animate-marquee-alert whitespace-nowrap py-2 will-change-transform">
          {[...items, ...items].map((item, i) => (
            <span
              key={`${item.id}-${i}`}
              className="inline-flex items-center gap-2 px-4 sm:px-5 text-xs sm:text-sm font-medium shrink-0"
            >
              <HighlightRow item={item} />
              <span className="text-amber-400/50 ml-1" aria-hidden>
                •
              </span>
            </span>
          ))}
        </div>
      )}
      {!single && (
        <>
          <div className="absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-amber-950 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-amber-950 to-transparent pointer-events-none" />
        </>
      )}
    </div>
  );
}
