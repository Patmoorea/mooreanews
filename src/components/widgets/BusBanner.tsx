"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bus, ArrowRight } from "lucide-react";
import type { NextBusDepartures } from "@/lib/buses";
import { formatBusLines, formatBusMinutesUntil } from "@/lib/buses";

/**
 * Bandeau bus visible sur toutes les pages (sous le ticker).
 */
export function BusBanner() {
  const [data, setData] = useState<NextBusDepartures | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/buses")
        .then((r) => r.json() as Promise<NextBusDepartures>)
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data) return null;

  const nextVaiare = data.toVaiare[0];
  const nextTiahura = data.toTiahura[0];
  const hasDeps = Boolean(nextVaiare || nextTiahura);

  return (
    <div
      className="relative z-30 border-b border-emerald-700/20 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white shadow-sm"
      role="region"
      aria-label="Horaires bus Moorea"
    >
      <Link
        href="/bus-moorea"
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8 hover:bg-white/5 transition-colors"
      >
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide sm:text-sm">
          <Bus size={16} className="text-emerald-200" aria-hidden />
          Bus Moorea
        </span>

        {data.dayKind === "sun" ? (
          <p className="text-xs sm:text-sm text-emerald-100">
            Pas de circulation aujourd&apos;hui (dimanche)
          </p>
        ) : !hasDeps ? (
          <p className="text-xs sm:text-sm text-emerald-100">
            Service terminé pour aujourd&apos;hui
          </p>
        ) : (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
            {nextVaiare ? (
              <span className="inline-flex items-center gap-1.5">
                <ArrowRight size={14} className="text-emerald-300 shrink-0" />
                <span className="text-emerald-200">Vaiare</span>
                <strong className="tabular-nums">{nextVaiare.time}</strong>
                <span className="hidden text-emerald-200/90 sm:inline">
                  {formatBusLines(nextVaiare.lines)}
                </span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                  {formatBusMinutesUntil(nextVaiare.minutesUntil)}
                </span>
              </span>
            ) : null}
            {nextTiahura ? (
              <span className="inline-flex items-center gap-1.5">
                <ArrowRight
                  size={14}
                  className="rotate-180 text-emerald-300 shrink-0"
                />
                <span className="text-emerald-200">Tiahura</span>
                <strong className="tabular-nums">{nextTiahura.time}</strong>
                <span className="hidden text-emerald-200/90 sm:inline">
                  {formatBusLines(nextTiahura.lines)}
                </span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                  {formatBusMinutesUntil(nextTiahura.minutesUntil)}
                </span>
              </span>
            ) : null}
          </div>
        )}

        <span className="ml-auto shrink-0 text-[11px] sm:text-xs font-semibold text-emerald-100">
          300 F · lun–sam · Guide complet →
        </span>
      </Link>
    </div>
  );
}
