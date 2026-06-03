"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Droplets, Zap, ChevronRight } from "lucide-react";
import type { HomeHighlight } from "@/lib/home-highlights";

function OutageIcon({ kind }: { kind: HomeHighlight["kind"] }) {
  if (kind === "coupure_eau") {
    return <Droplets size={22} className="shrink-0 text-sky-200" aria-hidden />;
  }
  return <Zap size={22} className="shrink-0 text-amber-200" aria-hidden />;
}

function isTodayHighlight(at: string): boolean {
  const key = new Date(at).toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
  return key === today;
}

/**
 * Bandeau très visible : coupures électricité & eau (priorité absolue).
 */
export function CriticalOutagesBanner() {
  const [outages, setOutages] = useState<HomeHighlight[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/home-highlights", { cache: "no-store" });
        if (!res.ok) return;
        const { highlights } = (await res.json()) as {
          highlights: HomeHighlight[];
        };
        const rows = (highlights ?? []).filter(
          (h) => h.kind === "coupure_edt" || h.kind === "coupure_eau",
        );
        if (!cancelled) setOutages(rows);
      } catch {
        /* silencieux */
      }
    }

    load();
    const id = setInterval(load, 3 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (outages.length === 0) return null;

  const hasToday = outages.some((o) => isTodayHighlight(o.at));

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative z-40 border-b-2 border-red-700/80 bg-gradient-to-r from-red-950 via-orange-900 to-red-950 text-white shadow-lg shadow-red-950/30"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-2 sm:mb-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest ring-1 ring-white/25">
            <AlertTriangle size={14} className="text-amber-300 animate-pulse" />
            {hasToday ? "Coupure en cours ou aujourd'hui" : "Coupure programmée"}
          </span>
          <Link
            href="/coupures"
            className="text-[11px] sm:text-xs font-semibold text-amber-100 hover:text-white underline-offset-2 hover:underline"
          >
            Toutes les coupures Moorea →
          </Link>
        </div>

        <ul className="space-y-2">
          {outages.map((o) => {
            const today = isTodayHighlight(o.at);
            return (
              <li key={o.id}>
                <Link
                  href={o.href}
                  className={`group flex items-start sm:items-center gap-3 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 transition-colors hover:bg-white/10 ${
                    today ? "bg-white/10 ring-1 ring-amber-400/40" : "bg-black/10"
                  }`}
                >
                  <OutageIcon kind={o.kind} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold leading-snug group-hover:text-amber-50">
                      {o.label}
                    </p>
                    {today ? (
                      <p className="mt-0.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-amber-200">
                        Aujourd&apos;hui — planifiez vos déplacements
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-white/50 group-hover:text-white mt-0.5 sm:mt-0"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
