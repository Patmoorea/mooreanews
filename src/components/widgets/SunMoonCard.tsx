"use client";

import { useEffect, useState } from "react";
import { Sunrise, Sunset, Sun } from "lucide-react";
import type { SunMoonData } from "@/lib/sun";

export function SunMoonCard() {
  const [data, setData] = useState<SunMoonData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sun")
      .then((r) => r.json() as Promise<SunMoonData>)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-soleil-400 via-couchant to-tiare-400 text-white shadow-[var(--shadow-sunset)] relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/80">
              Soleil & Lune
            </p>
            <h3 className="font-display text-xl mt-1">Cycle du jour</h3>
          </div>
          <Sun size={32} className="text-white animate-wave" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white/15 backdrop-blur rounded-xl p-3">
            <Sunrise size={16} className="mb-1" />
            <p className="text-[10px] uppercase tracking-wide opacity-80">
              Lever
            </p>
            <p className="font-bold text-lg">{data?.sunrise ?? "—"}</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-3">
            <Sunset size={16} className="mb-1" />
            <p className="text-[10px] uppercase tracking-wide opacity-80">
              Coucher
            </p>
            <p className="font-bold text-lg">{data?.sunset ?? "—"}</p>
          </div>
        </div>

        <div className="mt-3 bg-white/15 backdrop-blur rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wide opacity-80">
            Phase de la lune
          </p>
          <p className="font-semibold mt-1">{data?.moonPhase ?? "—"}</p>
          <p className="text-xs opacity-80 mt-0.5">
            Illuminée à {data?.moonIllumination ?? 0}% · Jour de{" "}
            {data?.dayLength ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
