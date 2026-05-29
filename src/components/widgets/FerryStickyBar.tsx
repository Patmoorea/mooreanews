"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ship, X, Ticket } from "lucide-react";
import { ferryBookingUrl } from "@/lib/constants";

type Departure = {
  time: string;
  company: string;
  minutesUntil: number;
};

type FerryData = {
  fromMoorea: Departure[];
  fromTahiti: Departure[];
};

export function FerryStickyBar() {
  const [data, setData] = useState<FerryData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/ferries")
        .then((r) => r.json() as Promise<FerryData>)
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 120_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (dismissed || !data) return null;

  const moorea = data.fromMoorea[0];
  const tahiti = data.fromTahiti[0];
  if (!moorea && !tahiti) return null;

  const next = moorea ?? tahiti;
  const bookingUrl = ferryBookingUrl(next.company);

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="mx-3 mb-3 rounded-2xl bg-gradient-to-r from-ocean-800 to-lagon-700 text-white shadow-[var(--shadow-tropical)] border border-white/10 overflow-hidden">
        <div className="flex items-stretch">
          <Link
            href="/#en-direct"
            className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0"
          >
            <Ship size={18} className="flex-shrink-0 text-lagon-200" />
            <div className="min-w-0 text-xs leading-tight">
              {moorea && (
                <p className="truncate">
                  <span className="text-ocean-300">M→T</span>{" "}
                  <strong>{moorea.company}</strong> {moorea.time}
                  <span className="text-ocean-300 ml-1">({moorea.minutesUntil}m)</span>
                </p>
              )}
              {tahiti && (
                <p className="truncate mt-0.5">
                  <span className="text-ocean-300">T→M</span>{" "}
                  <strong>{tahiti.company}</strong> {tahiti.time}
                  <span className="text-ocean-300 ml-1">({tahiti.minutesUntil}m)</span>
                </p>
              )}
            </div>
          </Link>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 text-xs font-semibold bg-white/15 hover:bg-white/25 border-l border-white/10"
            aria-label="Billetterie ferry"
          >
            <Ticket size={14} />
            Billets
          </a>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="px-3 text-ocean-300 hover:text-white border-l border-white/10"
            aria-label="Masquer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
