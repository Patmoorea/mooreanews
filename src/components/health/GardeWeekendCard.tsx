import { CalendarDays, Clock, ExternalLink, MapPin, Phone, Pill, Stethoscope } from "lucide-react";
import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";

const COMMUNE_FB = "https://www.facebook.com/CommuneMooreaMaiao";

function dayLabel(iso: string, weekday: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const month = d.toLocaleDateString("fr-FR", { month: "long", timeZone: "UTC" });
  return `${weekday} ${d.getUTCDate()} ${month}`;
}

function telHref(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length >= 8 ? `tel:+689${d.slice(-8)}` : "";
}

function PhoneLink({ phone, big = false }: { phone: string; big?: boolean }) {
  const href = telHref(phone);
  if (!href) return null;
  return (
    <a
      href={href}
      className={
        big
          ? "inline-flex items-center gap-2 px-5 py-3 rounded-full bg-tiare-500 text-white font-bold text-xl hover:bg-tiare-600"
          : "inline-flex items-center gap-1.5 font-semibold text-tiare-700 hover:underline"
      }
    >
      <Phone size={big ? 20 : 14} />
      {phone}
    </a>
  );
}

/** Carte lisible « garde du week-end » : médecin, horaires, lieu, appel direct, pharmacies + affiche officielle. */
export function GardeWeekendCard({ snap }: { snap: GardeMooreaSnapshot }) {
  const doctor = snap.doctor;
  const sat = dayLabel(snap.validFrom, "Samedi");
  const sameDay = snap.validFrom === snap.validTo;
  const sun = sameDay ? null : dayLabel(snap.validTo, "Dimanche");
  const poster = snap.communePosterUrl && !snap.communePosterUrl.includes("ordre-pharmaciens")
    ? snap.communePosterUrl
    : null;
  const source = snap.sourceUrl?.includes("facebook.com") ? snap.sourceUrl : COMMUNE_FB;

  return (
    <section
      aria-label="Garde médicale du week-end à Moorea"
      className="rounded-3xl border-2 border-tiare-300 bg-white shadow-sm overflow-hidden not-prose"
    >
      <div className="px-5 py-3 bg-gradient-to-r from-tiare-500 to-tiare-600 text-white flex items-center gap-2">
        <Stethoscope size={22} />
        <h2 className="font-display text-xl">Médecin de garde — Moorea</h2>
      </div>

      <div className={`grid gap-6 p-5 sm:p-6 ${poster ? "md:grid-cols-[1fr_minmax(0,320px)]" : ""}`}>
        <div className="space-y-5">
          {doctor?.name ? (
            <p className="font-display text-2xl sm:text-3xl text-ocean-950">{doctor.name}</p>
          ) : (
            <p className="text-ocean-700">Médecin non encore communiqué — appelez la DSP (40 47 01 44).</p>
          )}

          <ul className="space-y-2 text-ocean-900">
            {(snap.doctorHours?.saturday || !sun) && (
              <li className="flex items-start gap-2">
                <CalendarDays size={18} className="mt-0.5 text-tiare-600 shrink-0" />
                <span>
                  <strong className="capitalize">{sameDay ? snap.label : sat}</strong>
                  {snap.doctorHours?.saturday && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Clock size={14} /> {snap.doctorHours.saturday}
                    </span>
                  )}
                </span>
              </li>
            )}
            {sun && (
              <li className="flex items-start gap-2">
                <CalendarDays size={18} className="mt-0.5 text-tiare-600 shrink-0" />
                <span>
                  <strong>{sun}</strong>
                  {snap.doctorHours?.sunday && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Clock size={14} /> {snap.doctorHours.sunday}
                    </span>
                  )}
                </span>
              </li>
            )}
            {snap.doctorAddress && (
              <li className="flex items-start gap-2">
                <MapPin size={18} className="mt-0.5 text-tiare-600 shrink-0" />
                <span>{snap.doctorAddress}</span>
              </li>
            )}
          </ul>

          {doctor?.phone && doctor.phone !== "—" && <PhoneLink phone={doctor.phone} big />}

          {snap.pharmacyHours && snap.pharmacyHours.length > 0 && (
            <div className="pt-4 border-t border-ocean-100">
              <h3 className="flex items-center gap-2 font-display text-lg text-ocean-950 mb-3">
                <Pill size={18} className="text-tiare-600" /> Horaires des pharmacies
              </h3>
              <ul className="grid gap-3 sm:grid-cols-3">
                {snap.pharmacyHours.map((p) => (
                  <li key={p.district} className="rounded-2xl bg-ocean-50 p-3 text-sm">
                    <p className="font-semibold text-ocean-950">{p.district}</p>
                    {p.phone && <PhoneLink phone={p.phone} />}
                    <p className="mt-1 text-ocean-800">Sam. : {p.saturday ?? "—"}</p>
                    {!sameDay && <p className="text-ocean-800">Dim. : {p.sunday ?? "—"}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-ocean-600">
            Source :{" "}
            <a href={source} target="_blank" rel="noopener noreferrer" className="underline">
              Commune de Moorea-Maiao
            </a>
            . Urgences : SAMU 15 · Pompiers 18.
          </p>
        </div>

        {poster && (
          <a
            href={poster}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl overflow-hidden border border-ocean-100 self-start"
            title="Voir l'affiche officielle de la commune en grand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- affiche officielle, qualité d'origine */}
            <img
              src={poster}
              alt={`Affiche officielle de la Commune de Moorea-Maiao — médecin de garde ${snap.label}`}
              className="w-full h-auto"
              loading="lazy"
            />
            <span className="flex items-center justify-center gap-1 py-2 text-xs font-semibold text-ocean-700 group-hover:text-tiare-700">
              <ExternalLink size={12} /> Affiche de la commune en grand
            </span>
          </a>
        )}
      </div>
    </section>
  );
}
