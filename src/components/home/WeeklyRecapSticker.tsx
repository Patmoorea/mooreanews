"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { HERO_PILL_GLASS, heroPillSurface } from "@/components/home/hero-sticker-pill";

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
      className={`inline-flex items-center gap-2 max-w-[min(100%,28rem)] px-3 py-1.5 ${HERO_PILL_GLASS} ${heroPillSurface(payload.isFresh)}`}
    >
      <CalendarDays
        size={14}
        className={`shrink-0 ${payload.isFresh ? "text-lagon-200" : "text-white/80"}`}
        aria-hidden
      />
      <span className="truncate">{payload.label}</span>
    </Link>
  );
}
