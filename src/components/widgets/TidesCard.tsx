"use client";

import { useEffect, useState } from "react";
import { Waves, ArrowUp, ArrowDown } from "lucide-react";
import type { TidesData } from "@/lib/tides";

export function TidesCard() {
  const [data, setData] = useState<TidesData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tides")
      .then((r) => r.json() as Promise<TidesData>)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-tipanier-500 to-lagon-700 text-white p-6 shadow-[var(--shadow-tropical)] relative overflow-hidden">
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/80">
              Marées indicatives
            </p>
            <h3 className="font-display text-xl mt-1">Lagon de Moorea</h3>
          </div>
          <Waves size={32} className="animate-wave" />
        </div>

        <ul className="space-y-2">
          {(data?.tides ?? []).slice(0, 4).map((t, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-white/15 backdrop-blur rounded-xl px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {t.type === "haute" ? (
                  <ArrowUp size={14} className="text-soleil-200" />
                ) : (
                  <ArrowDown size={14} className="text-lagon-100" />
                )}
                <span className="font-semibold capitalize">
                  Marée {t.type}
                </span>
              </div>
              <span className="font-bold text-lg">{t.time}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[10px] leading-relaxed opacity-80">
          {data?.note ?? "Vérifiez auprès du SHOM avant toute activité maritime."}
        </p>
      </div>
    </div>
  );
}
