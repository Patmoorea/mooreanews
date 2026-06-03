"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Anchor } from "lucide-react";
import type { HomeHighlight } from "@/lib/home-highlights";

function HighlightRow({ item }: { item: HomeHighlight }) {
  return (
    <Link
      href={item.href}
      className="inline-flex items-center gap-2 hover:text-white hover:underline underline-offset-2"
    >
      <Anchor size={14} className="text-tipanier-200 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

/** Bandeau secondaire : paquebots croisière uniquement (coupures = CriticalOutagesBanner). */
export function ServiceHighlightsTicker() {
  const [items, setItems] = useState<HomeHighlight[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/home-highlights", { cache: "no-store" });
        if (!res.ok) return;
        const { highlights } = (await res.json()) as {
          highlights: HomeHighlight[];
        };
        const cruises = (highlights ?? []).filter((h) => h.kind === "paquebot");
        if (!cancelled) setItems(cruises);
      } catch {
        /* silencieux */
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
      aria-label="Paquebots et croisières"
      className="relative z-30 overflow-hidden bg-gradient-to-r from-indigo-950 via-violet-900 to-indigo-950 text-violet-50 border-b border-violet-800/80"
    >
      <div className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-200">
        <Anchor size={11} />
        Croisière
      </div>
      {single ? (
        <div className="flex items-center justify-center gap-2 px-4 sm:pl-28 py-2 text-xs sm:text-sm font-medium text-center">
          <HighlightRow item={items[0]} />
        </div>
      ) : (
        <div className="flex animate-marquee-alert whitespace-nowrap py-2 sm:pl-24 will-change-transform">
          {[...items, ...items].map((item, i) => (
            <span
              key={`${item.id}-${i}`}
              className="inline-flex items-center gap-2 px-4 sm:px-5 text-xs sm:text-sm font-medium shrink-0"
            >
              <HighlightRow item={item} />
              <span className="text-violet-400/50 ml-1" aria-hidden>
                •
              </span>
            </span>
          ))}
        </div>
      )}
      {!single && (
        <>
          <div className="absolute inset-y-0 left-0 w-8 sm:w-24 bg-gradient-to-r from-indigo-950 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-indigo-950 to-transparent pointer-events-none" />
        </>
      )}
    </div>
  );
}
