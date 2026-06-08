"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

type GardeWeekendPayload = {
  active?: boolean;
  href?: string;
  label?: string;
  isFresh?: boolean;
};

/** Pastille hero — garde week-end (vendredi → dimanche), lien vers l'article. */
export function GardeWeekendSticker() {
  const [payload, setPayload] = useState<GardeWeekendPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/garde-weekend", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as GardeWeekendPayload;
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
      className={`inline-flex items-center gap-2 max-w-[min(100%,26rem)] px-3 py-1.5 rounded-full backdrop-blur-md border text-white text-[11px] sm:text-xs font-semibold shadow-lg transition-colors ${
        payload.isFresh
          ? "bg-rose-700/95 border-rose-400/70 shadow-rose-950/40 hover:bg-rose-600"
          : "bg-ocean-800/90 border-lagon-400/60 shadow-ocean-950/30 hover:bg-ocean-700"
      }`}
    >
      <Stethoscope size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{payload.label}</span>
    </Link>
  );
}
