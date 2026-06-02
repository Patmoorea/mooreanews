import { ExternalLink, CloudLightning } from "lucide-react";
import {
  fetchMeteoVigilance,
  METEO_VIGILANCE_MAP_URL,
  vigilanceCardTitle,
  vigilanceLocalLevel,
  vigilanceNationalFootnote,
} from "@/lib/meteo-vigilance";
import { syncMeteoVigilanceAlert } from "@/lib/meteo-vigilance-sync";

const LEVEL_STYLES: Record<
  number,
  { ring: string; badge: string; label: string }
> = {
  1: {
    ring: "border-tipanier-200 bg-tipanier-50",
    badge: "bg-tipanier-600 text-white",
    label: "Vert",
  },
  2: {
    ring: "border-soleil-300 bg-soleil-50",
    badge: "bg-soleil-500 text-ocean-950",
    label: "Jaune",
  },
  3: {
    ring: "border-couchant/40 bg-couchant/10",
    badge: "bg-couchant text-white",
    label: "Orange",
  },
  4: {
    ring: "border-tiare-300 bg-tiare-50",
    badge: "bg-tiare-600 text-white",
    label: "Rouge",
  },
  5: {
    ring: "border-tiare-400 bg-tiare-100",
    badge: "bg-tiare-700 text-white",
    label: "Rouge",
  },
};

export async function MeteoVigilanceCard() {
  await syncMeteoVigilanceAlert();

  let snapshot;
  try {
    snapshot = await fetchMeteoVigilance();
  } catch {
    return (
      <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-[var(--shadow-soft)]">
        <p className="text-sm text-ocean-600">
          Vigilance Météo-France indisponible —{" "}
          <a
            href="https://meteo.pf/fr/vigilance"
            className="text-tiare-600 font-semibold hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            meteo.pf
          </a>
        </p>
      </div>
    );
  }

  const level = vigilanceLocalLevel(snapshot);
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];
  const nationalNote = vigilanceNationalFootnote(snapshot);

  return (
    <div
      className={`rounded-2xl border p-5 shadow-[var(--shadow-soft)] ${style.ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CloudLightning size={20} className="text-ocean-700" />
          <span className="text-xs font-semibold uppercase tracking-widest text-ocean-600">
            Météo-France
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}
        >
          {style.label}
        </span>
      </div>
      <p className="mt-3 font-semibold text-ocean-950 leading-snug">
        {vigilanceCardTitle(snapshot)}
      </p>
      {nationalNote ? (
        <p className="mt-2 text-xs text-ocean-700">{nationalNote}</p>
      ) : null}
      <p className="mt-2 text-xs text-ocean-600">
        Tahiti–Moorea : niveau {snapshot.mooreaMaxColorId}
        {snapshot.nationalMaxColorId > snapshot.mooreaMaxColorId
          ? ` · Polynésie : ${snapshot.nationalMaxColorId}`
          : null}
      </p>
      <div className="mt-4">
        <a
          href={METEO_VIGILANCE_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-ocean-700 hover:text-tiare-600"
        >
          Carte officielle meteo.pf
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
