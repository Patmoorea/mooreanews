"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Droplets, Zap } from "lucide-react";
import type { HomeHighlight } from "@/lib/home-highlights";

/** Pastille compacte sur le hero quand une coupure EDT/eau est programmée. */
export function OutageSticker() {
  const [outage, setOutage] = useState<HomeHighlight | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/home-highlights", { cache: "no-store" });
        if (!res.ok) return;
        const { highlights } = (await res.json()) as {
          highlights: HomeHighlight[];
        };
        const next =
          (highlights ?? []).find(
            (h) => h.kind === "coupure_edt" || h.kind === "coupure_eau",
          ) ?? null;
        if (!cancelled) setOutage(next);
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

  if (!outage) return null;

  const isEdt = outage.kind === "coupure_edt";
  const Icon = isEdt ? Zap : Droplets;

  return (
    <Link
      href="/coupures"
      className="inline-flex items-center gap-2 max-w-full px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-md border border-red-400/60 text-white text-[11px] sm:text-xs font-semibold shadow-lg shadow-red-950/30 hover:bg-red-500 transition-colors"
    >
      <Icon size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{outage.label}</span>
    </Link>
  );
}
