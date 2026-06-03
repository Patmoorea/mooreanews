"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Droplets, Zap } from "lucide-react";
import type { UtilityOutagesResult } from "@/lib/utility-outages";
import { formatOutageWindow } from "@/lib/utility-outages";

export function UtilityOutagesCard() {
  const [data, setData] = useState<UtilityOutagesResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/utility-outages")
      .then((r) => r.json() as Promise<UtilityOutagesResult>)
      .then((d) => {
        if (!cancelled && d.all) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const next = data?.all.slice(0, 3) ?? [];

  return (
    <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-[var(--shadow-soft)] h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-soleil-600" />
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-ocean-600">
              Coupures
            </span>
            <p className="text-sm font-display text-ocean-950 leading-tight">
              EDT & eau
            </p>
          </div>
        </div>
        <Link
          href="/coupures"
          className="text-xs font-semibold text-tiare-600 hover:underline shrink-0"
        >
          Tout voir →
        </Link>
      </div>

      {next.length === 0 ? (
        <p className="mt-4 text-sm text-ocean-600">
          Aucune coupure programmée proche.{" "}
          <Link href="/coupures" className="text-tiare-600 hover:underline">
            Calendrier
          </Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {next.map((o) => (
            <li
              key={o.id}
              className="flex items-start gap-2 text-sm border-b border-ocean-50 pb-2 last:border-0 last:pb-0"
            >
              {o.kind === "coupure_eau" ? (
                <Droplets size={14} className="text-lagon-600 mt-0.5 shrink-0" />
              ) : (
                <Zap size={14} className="text-soleil-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="font-semibold text-ocean-950 line-clamp-2">
                  {o.district ?? o.commune ?? o.title}
                </p>
                <p className="text-xs text-ocean-600">
                  {formatOutageWindow(o.startsAt, o.endsAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
