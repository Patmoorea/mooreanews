"use client";

import Link from "next/link";
import { Ship, TrendingDown, TrendingUp } from "lucide-react";
import {
  formatPercentChange,
  formatTrafficNumber,
  getLatestMooreaComparison,
  getMaritimeTrafficData,
  getDisplayYears,
  getTrafficYears,
  percentChange,
} from "@/lib/maritime-traffic";

export function MaritimeTrafficCard() {
  const data = getMaritimeTrafficData();
  const { current, previous } = getLatestMooreaComparison();
  const pct = previous
    ? percentChange(current.data.totalPassengers, previous.data.totalPassengers)
    : null;

  return (
    <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-[var(--shadow-soft)] h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Ship size={20} className="text-lagon-700" />
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-ocean-600">
              Trafic ferry
            </span>
            <p className="text-sm font-display text-ocean-950 leading-tight">
              Tahiti ↔ Moorea
            </p>
          </div>
        </div>
        <Link
          href="/trafic-ferry"
          className="text-xs font-semibold text-tiare-600 hover:underline shrink-0"
        >
          Détails →
        </Link>
      </div>

      <p className="mt-4 text-2xl font-display text-ocean-950 tabular-nums">
        {formatTrafficNumber(current.data.totalPassengers)}
        <span className="text-sm font-sans text-ocean-500 ml-2">
          passagers ({current.year})
        </span>
      </p>

      {previous ? (
        <p className="mt-2 text-sm flex items-center gap-1.5">
          {pct != null && pct >= 0 ? (
            <TrendingUp size={14} className="text-tipanier-600" />
          ) : (
            <TrendingDown size={14} className="text-lagon-600" />
          )}
          <span className="text-ocean-700">
            {formatPercentChange(
              current.data.totalPassengers,
              previous.data.totalPassengers,
            )}{" "}
            vs {previous.year}
          </span>
        </p>
      ) : null}

      <p className="mt-3 text-xs text-ocean-500">
        Source {data.sources.dpam.label} ·{" "}
        {getDisplayYears(2).join(" · ")}
      </p>
    </div>
  );
}
