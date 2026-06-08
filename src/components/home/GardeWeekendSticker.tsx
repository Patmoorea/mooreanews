"use client";

import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import {
  HERO_STICKER_ACCENTS,
  HeroStickerVignette,
} from "@/components/home/HeroStickerVignette";

type GardeWeekendPayload = {
  active?: boolean;
  href?: string;
  label?: string;
  isFresh?: boolean;
};

/** Vignette hero — garde week-end (vendredi → dimanche). */
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
    <HeroStickerVignette
      href={payload.href}
      label={payload.label}
      icon={Stethoscope}
      accent={HERO_STICKER_ACCENTS.garde}
      isFresh={payload.isFresh}
    />
  );
}
