import type { Metadata } from "next";
import Link from "next/link";
import { UtensilsCrossed, Calendar, Music } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { OPEN_STATUS_HELP, openStatusLabel } from "@/lib/restaurant-open-status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ce soir à Moorea",
  description:
    "Restaurants ouverts, événements et sorties ce soir à Moorea — mis à jour chaque jour.",
  alternates: { canonical: "/ce-soir" },
};

export default async function CeSoirPage() {
  const data = await getMooreaDuJour();
  const eveningEvents = data.todayEvents.filter(
    (e) => !e.time || parseInt(e.time, 10) >= 17,
  );

  return (
    <>
      <PageHeader
        badge="Agenda"
        title="Ce soir à Moorea"
        description={`${data.weather.temp}°C — ${data.weather.description}. Où manger, où sortir ce soir.`}
        variant="tiare"
      />
      <Container className="py-12 sm:py-16 max-w-3xl">
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed size={20} className="text-tiare-600" />
            <h2 className="font-display text-xl text-ocean-950">Restaurants ouverts</h2>
          </div>
          <p className="mb-4 text-xs text-ocean-500">{OPEN_STATUS_HELP}</p>
          {data.openRestaurantsNow.length === 0 ? (
            <p className="text-sm text-ocean-600">
              Aucun restaurant confirmé ouvert pour l&apos;instant —{" "}
              <Link href="/restaurants" className="text-lagon-700 font-semibold hover:underline">
                annuaire complet
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-3">
              {data.openRestaurantsNow.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/restaurants/${r.slug}`}
                    className="block bg-white rounded-xl border border-ocean-100 px-4 py-3 hover:border-lagon-300 transition-colors"
                  >
                    <span className="font-semibold text-ocean-900">{r.name}</span>
                    <span className="block text-xs text-ocean-500">
                      {r.district} · {openStatusLabel(r.source)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {eveningEvents.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-lagon-600" />
              <h2 className="font-display text-xl text-ocean-950">Événements ce soir</h2>
            </div>
            <ul className="grid gap-3">
              {eveningEvents.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/evenements/${e.slug}`}
                    className="block bg-white rounded-xl border border-ocean-100 px-4 py-3 hover:border-lagon-300 transition-colors"
                  >
                    <span className="font-semibold text-ocean-900">{e.title}</span>
                    <span className="block text-xs text-ocean-500">
                      {e.time ? `${e.time} · ` : ""}
                      {e.location}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.weekendEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Music size={20} className="text-tiare-600" />
              <h2 className="font-display text-xl text-ocean-950">Ce week-end</h2>
            </div>
            <ul className="grid gap-2">
              {data.weekendEvents.slice(0, 5).map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/evenements/${e.slug}`}
                    className="text-sm text-lagon-700 font-semibold hover:underline"
                  >
                    {e.title}
                  </Link>
                  <span className="text-xs text-ocean-500 ml-2">{e.date}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/evenements"
              className="inline-block mt-4 text-sm font-semibold text-lagon-700 hover:underline"
            >
              Agenda complet →
            </Link>
          </section>
        )}
      </Container>
    </>
  );
}
