"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

type WeeklyRecapPayload = {
  active?: boolean;
  href?: string;
  label?: string;
  isFresh?: boolean;
};

/** Pastille hero — récap semaine (lundi → dimanche), lien vers l'article. */
export function WeeklyRecapSticker() {
  const [payload, setPayload] = useState<WeeklyRecapPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/weekly-recap", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as WeeklyRecapPayload;
        if (!cancelled) {
          setPayload(data.active ? data : null);
        }
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

  if (!payload?.href || !payload.label) return null;

  return (
    <Link
      href={payload.href}
      className={`inline-flex items-center gap-2 max-w-[min(100%,28rem)] px-3 py-1.5 rounded-full backdrop-blur-md border text-white text-[11px] sm:text-xs font-semibold shadow-lg transition-colors ${
        payload.isFresh
          ? "bg-cyan-700/95 border-cyan-300/70 shadow-cyan-950/40 hover:bg-cyan-600"
          : "bg-teal-800/90 border-teal-400/60 shadow-teal-950/30 hover:bg-teal-700"
      }`}
    >
      <CalendarDays size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{payload.label}</span>
    </Link>
  );
}
