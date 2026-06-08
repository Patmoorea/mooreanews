"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { HERO_PILL_GLASS, heroPillSurface } from "@/components/home/hero-sticker-pill";

type JobRow = {
  id: string;
  title: string;
  sourceName: string;
  publishedAt: string;
  fetchedAt: string;
};

const NEW_DAYS = 3;

function tahitiDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
}

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

/** Pastille compacte sur le hero — offres d'emploi récentes à Moorea. */
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
    <Link
      href="/emploi-formation"
      className={`inline-flex items-center gap-2 max-w-[min(100%,24rem)] px-3 py-1.5 ${HERO_PILL_GLASS} ${heroPillSurface(isFresh)}`}
    >
      <Briefcase
        size={14}
        className={`shrink-0 ${isFresh ? "text-soleil-300" : "text-white/80"}`}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}
