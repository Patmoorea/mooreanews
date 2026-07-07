"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ship, Car } from "lucide-react";
import { formatMinutesUntil, type Departure } from "@/lib/ferries";

type FerryData = {
  fromMoorea: Departure[];
  fromTahiti: Departure[];
};

export function CovoiturageFerryPanel() {
  const [ferry, setFerry] = useState<FerryData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ferries")
      .then((r) => r.json() as Promise<FerryData>)
      .then((d) => {
        if (!cancelled) setFerry(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const nextMoorea = ferry?.fromMoorea[0];
  const nextTahiti = ferry?.fromTahiti[0];

  return (
    <div className="rounded-2xl border border-lagon-200 bg-gradient-to-br from-lagon-50 to-white p-5">
      <div className="flex items-center gap-2 text-ocean-900 font-display font-bold">
        <Ship className="h-5 w-5 text-lagon-600" />
        Prochains ferries
      </div>
      <p className="mt-1 text-xs text-ocean-600">
        Horaires ferry pour caler votre départ en voiture — parking Vaiare ~300
        XPF/jour.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
        <FerryLine
          label="Moorea → Tahiti"
          dep={nextMoorea}
        />
        <FerryLine
          label="Tahiti → Moorea"
          dep={nextTahiti}
        />
      </div>
      <Link
        href="/guides/ferry-tahiti-moorea"
        className="mt-4 inline-block text-xs font-medium text-lagon-700 hover:underline"
      >
        Guide ferry Tahiti–Moorea →
      </Link>
    </div>
  );
}

function FerryLine({
  label,
  dep,
}: {
  label: string;
  dep?: Departure;
}) {
  if (!dep) {
    return (
      <div className="rounded-xl bg-white/80 px-3 py-2 text-ocean-500">
        {label} — horaires en chargement…
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-white/80 px-3 py-2 border border-lagon-100">
      <div className="text-xs text-ocean-500">{label}</div>
      <div className="font-bold text-ocean-900">
        {dep.time} · {dep.company}
      </div>
      <div className="text-xs text-lagon-700">
        {formatMinutesUntil(dep.minutesUntil)}
      </div>
    </div>
  );
}

export function CovoiturageStickyCta() {
  return (
    <Link
      href="/covoiturage"
      className="fixed bottom-20 right-4 z-30 md:bottom-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-lagon-600 to-ocean-700 px-4 py-3 text-sm font-bold text-white shadow-lg md:hidden"
    >
      <Car className="h-4 w-4" />
      Covoiturage
    </Link>
  );
}
