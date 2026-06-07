import Image from "next/image";
import Link from "next/link";
import { Cross, ExternalLink, Phone, Pill, Stethoscope } from "lucide-react";
import type { HealthOnCallData, OnCallDuty } from "@/lib/health-on-call-shared";

type Props = {
  data: HealthOnCallData;
  variant?: "banner" | "page";
};

function OnDutyCard({
  kind,
  duty,
  scheduleImage,
}: {
  kind: "pharmacy" | "doctor";
  duty: OnCallDuty | null;
  scheduleImage?: HealthOnCallData["officialDoctorSchedule"];
}) {
  const isPharmacy = kind === "pharmacy";
  const Icon = isPharmacy ? Pill : Stethoscope;
  const title = isPharmacy ? "Pharmacie de garde" : "Médecin de garde";
  const emptyHint = isPharmacy
    ? "Non communiquée — appelez la DSP ou la commune."
    : "Non communiqué — appelez la DSP ou consultez le planning officiel ci-dessous.";

  return (
    <div className="rounded-2xl border-2 border-tiare-300 bg-white overflow-hidden shadow-sm flex flex-col h-full">
      <div className="px-4 py-3 bg-gradient-to-r from-tiare-500 to-tiare-600 text-white flex items-center gap-2">
        <Icon size={20} />
        <h3 className="font-display text-lg">{title} — Moorea</h3>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {duty ? (
          <>
            <p className="font-display text-xl sm:text-2xl text-ocean-950">{duty.name}</p>
            {duty.address && (
              <p className="mt-1 text-sm text-ocean-700">{duty.address}</p>
            )}
            {duty.phone && duty.phone !== "—" && (
              <a
                href={duty.phoneHref}
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-tiare-500 text-white font-bold text-lg w-fit hover:bg-tiare-600"
              >
                <Phone size={18} />
                {duty.phone}
              </a>
            )}
            <p className="mt-3 text-xs text-ocean-500">Source : {duty.source}</p>
            {duty.sourceUrl && (
              <a
                href={duty.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-tiare-700"
              >
                Voir l&apos;annonce
                <ExternalLink size={10} />
              </a>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-ocean-700">{emptyHint}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="tel:+68940470144"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ocean-900 text-white text-sm font-semibold"
              >
                <Phone size={14} />
                DSP 40 47 01 44
              </a>
              <a
                href="tel:+68940470147"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ocean-300 text-ocean-900 text-sm font-semibold"
              >
                40 47 01 47
              </a>
            </div>
          </>
        )}

        {!duty && !isPharmacy && scheduleImage && (
          <figure className="mt-4 rounded-xl border border-ocean-100 overflow-hidden">
            <div className="relative aspect-[4/5] bg-ocean-50">
              <Image
                src={scheduleImage.imageUrl}
                alt={scheduleImage.label}
                fill
                className="object-contain p-1"
                sizes="(max-width: 640px) 100vw, 400px"
                unoptimized
              />
            </div>
            <figcaption className="px-2 py-2 text-[11px] text-ocean-600 border-t">
              {scheduleImage.sourceName}
              {scheduleImage.updatedAt ? ` · MAJ ${scheduleImage.updatedAt}` : ""}
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  );
}

export function HealthOnCallPanel({ data, variant = "page" }: Props) {
  const isBanner = variant === "banner";

  return (
    <div
      className={
        isBanner
          ? "rounded-2xl border-2 border-tiare-300 bg-gradient-to-br from-tiare-50 via-white to-lagon-50 shadow-[var(--shadow-tropical)] overflow-hidden"
          : ""
      }
    >
      {isBanner && (
        <div className="px-5 py-4 sm:px-6 border-b border-tiare-200/80 bg-tiare-500/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tiare-500 text-white text-xs font-bold uppercase tracking-wider">
              <Cross size={12} />
              Week-end &amp; jours fériés
            </span>
            {data.holidayLabel && (
              <span className="text-xs font-semibold text-tiare-800 bg-tiare-100 px-2.5 py-1 rounded-full">
                {data.holidayLabel}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-ocean-700 capitalize">{data.periodLabel}</p>
        </div>
      )}

      <div className={isBanner ? "p-5 sm:p-6" : ""}>
        {!isBanner && (
          <h1 className="font-display text-2xl sm:text-3xl text-ocean-950 mb-6">
            Garde à Moorea
          </h1>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <OnDutyCard kind="pharmacy" duty={data.onDutyPharmacy} />
          <OnDutyCard
            kind="doctor"
            duty={data.onDutyDoctor}
            scheduleImage={data.officialDoctorSchedule}
          />
        </div>

        <p className="mt-4 text-xs text-ocean-500">
          En cas d&apos;urgence : SAMU{" "}
          <a href="tel:15" className="font-semibold underline">
            15
          </a>
          {" · "}
          Hôpital Afareaitu{" "}
          <a href="tel:+68940552222" className="font-semibold underline">
            40 55 22 22
          </a>
          {" · "}
          Pompiers{" "}
          <a href="tel:18" className="font-semibold underline">
            18
          </a>
        </p>

        {isBanner && (
          <Link
            href="/sante-garde"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-tiare-700 hover:text-tiare-800"
          >
            Page garde Moorea
          </Link>
        )}
      </div>
    </div>
  );
}
