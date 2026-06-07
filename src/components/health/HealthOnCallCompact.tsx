import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { getHealthOnCall } from "@/lib/health-on-call";

/** Lien compact vers la fiche garde (dashboard accueil). */
export async function HealthOnCallCompact() {
  const data = await getHealthOnCall();
  if (!data.showProminent && !data.onDutyPharmacy) return null;

  return (
    <Link
      href="/sante-garde"
      className="flex items-start gap-3 rounded-2xl border border-tiare-200 bg-gradient-to-br from-tiare-50 to-white p-4 shadow-[var(--shadow-soft)] hover:border-tiare-300 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tiare-500 to-tiare-600 text-white flex items-center justify-center flex-shrink-0">
        <Stethoscope size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-tiare-700">
          {data.showProminent ? "Week-end & fériés" : "Santé"}
        </p>
        <p className="font-display text-lg text-ocean-950">Pharmacie &amp; médecin de garde</p>
        <p className="text-sm text-ocean-700 mt-0.5 line-clamp-2">
          {data.onDutyPharmacy && data.onDutyDoctor
            ? `${data.onDutyPharmacy.name} · ${data.onDutyDoctor.name}`
            : data.onDutyPharmacy
              ? `${data.onDutyPharmacy.name} · ${data.onDutyPharmacy.phone}`
              : data.onDutyDoctor
                ? `${data.onDutyDoctor.name} · ${data.onDutyDoctor.phone}`
                : "DSP 40 47 01 44 · garde Moorea"}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-tiare-700">
          Voir la fiche
          <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
