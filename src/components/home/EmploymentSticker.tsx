"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";

type JobRow = {
  id: string;
  title: string;
  sourceName: string;
  publishedAt: string;
};

const NEW_DAYS = 14;

function tahitiDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
}

function isNewOffer(publishedAt: string): boolean {
  const ageMs = Date.now() - Date.parse(publishedAt);
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
  const fresh = jobs.filter((j) => isNewOffer(j.publishedAt));
  const list = fresh.length > 0 ? fresh : jobs;

  if (list.length === 0) return "";

  if (list.length > 1) {
    const n = fresh.length > 0 ? fresh.length : list.length;
    return `${n} nouvelle${n > 1 ? "s" : ""} offre${n > 1 ? "s" : ""} emploi Moorea`;
  }

  const job = list[0];
  const prefix = isNewOffer(job.publishedAt)
    ? "Nouvelle offre"
    : "Offre emploi";
  return `${prefix} · ${truncateTitle(job.title)} · ${shortSource(job.sourceName)}`;
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
          setIsFresh(offers.some((o) => isNewOffer(o.publishedAt)));
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
      className={`inline-flex items-center gap-2 max-w-[min(100%,24rem)] px-3 py-1.5 rounded-full backdrop-blur-md border text-white text-[11px] sm:text-xs font-semibold shadow-lg transition-colors ${
        isFresh
          ? "bg-emerald-700/95 border-emerald-400/70 shadow-emerald-950/40 hover:bg-emerald-600"
          : "bg-teal-800/90 border-teal-400/60 shadow-teal-950/30 hover:bg-teal-700"
      }`}
    >
      <Briefcase size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}
