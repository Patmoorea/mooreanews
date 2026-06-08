"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { HERO_PILL_GLASS, heroPillSurface } from "@/components/home/hero-sticker-pill";

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
      className={`inline-flex items-center gap-2 max-w-[min(100%,26rem)] px-3 py-1.5 ${HERO_PILL_GLASS} ${heroPillSurface(payload.isFresh)}`}
    >
      <Stethoscope
        size={14}
        className={`shrink-0 ${payload.isFresh ? "text-rose-200" : "text-white/80"}`}
        aria-hidden
      />
      <span className="truncate">{payload.label}</span>
    </Link>
  );
}
