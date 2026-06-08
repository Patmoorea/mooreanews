"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  HERO_STICKER_ACCENTS,
  HeroStickerVignette,
} from "@/components/home/HeroStickerVignette";

type WeeklyRecapPayload = {
  active?: boolean;
  href?: string;
  label?: string;
  isFresh?: boolean;
};

/** Vignette hero — récap semaine (lundi → dimanche). */
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
    <HeroStickerVignette
      href={payload.href}
      label={payload.label}
      icon={CalendarDays}
      accent={HERO_STICKER_ACCENTS.agenda}
      isFresh={payload.isFresh}
    />
  );
}
