"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import {
  HERO_STICKER_ACCENTS,
  HeroStickerVignette,
} from "@/components/home/HeroStickerVignette";

type JobRow = {
  id: string;
  title: string;
  sourceName: string;
  publishedAt: string;
  fetchedAt: string;
};

const NEW_DAYS = 3;

function isNewOffer(fetchedAt: string): boolean {
  const ageMs = Date.now() - Date.parse(fetchedAt);
  return ageMs >= 0 && ageMs <= NEW_DAYS * 24 * 60 * 60 * 1000;
}

function shortSource(name: string): string {
  if (/sefi/i.test(name)) return "SEFI";
  if (/aravihi/i.test(name)) return "Aravihi";
  if (/cgf/i.test(name)) return "CGF";
  if (/commune/i.test(name)) return "Commune";
  return name.split(/\s+/)[0] ?? name;
}

function truncateTitle(title: string, max = 42): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function labelFor(jobs: JobRow[]): string {
  const fresh = jobs.filter((j) => isNewOffer(j.fetchedAt));

  if (jobs.length === 0) return "";

  if (fresh.length > 1) {
    return `${fresh.length} nouvelles offres emploi Moorea`;
  }

  if (fresh.length === 1) {
    const job = fresh[0]!;
    return `Nouvelle offre · ${truncateTitle(job.title)} · ${shortSource(job.sourceName)}`;
  }

  if (jobs.length > 1) {
    return `${jobs.length} offres emploi Moorea`;
  }

  const job = jobs[0]!;
  return `Offre emploi · ${truncateTitle(job.title)} · ${shortSource(job.sourceName)}`;
}

/** Vignette hero — offres d'emploi récentes à Moorea. */
export function EmploymentSticker() {
  const [label, setLabel] = useState<string | null>(null);
  const [isFresh, setIsFresh] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/employment-recent", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { offers?: JobRow[] };
        const offers = data.offers ?? [];
        if (offers.length === 0) {
          if (!cancelled) {
            setLabel(null);
            setIsFresh(false);
          }
          return;
        }
        const text = labelFor(offers);
        if (!cancelled) {
          setLabel(text || null);
          setIsFresh(offers.some((o) => isNewOffer(o.fetchedAt)));
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

  if (!label) return null;

  return (
    <HeroStickerVignette
      href="/emploi-formation"
      label={label}
      icon={Briefcase}
      accent={HERO_STICKER_ACCENTS.emploi}
      isFresh={isFresh}
    />
  );
}
