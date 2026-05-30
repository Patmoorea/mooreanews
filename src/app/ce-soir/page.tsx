import type { Metadata } from "next";
import Link from "next/link";
import { UtensilsCrossed, Calendar, Music } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";

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
          {data.openRestaurants.length === 0 ? (
            <p className="text-sm text-ocean-600">
              Horaires non renseignés — consultez{" "}
              <Link href="/restaurants" className="text-lagon-700 font-semibold hover:underline">
                la liste des restaurants
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-3">
              {data.openRestaurants.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/restaurants/${r.slug}`}
                    className="block bg-white rounded-xl border border-ocean-100 px-4 py-3 hover:border-lagon-300 transition-colors"
                  >
                    <span className="font-semibold text-ocean-900">{r.name}</span>
                    <span className="block text-xs text-ocean-500">{r.district}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-lagon-600" />
            <h2 className="font-display text-xl text-ocean-950">Événements ce soir</h2>
          </div>
          {eveningEvents.length === 0 ? (
            <p className="text-sm text-ocean-600">
              Rien de prévu ce soir —{" "}
              <Link href="/evenements" className="text-lagon-700 font-semibold hover:underline">
                voir l&apos;agenda complet
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-3">
              {eveningEvents.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/evenements/${e.slug}`}
                    className="block bg-white rounded-xl border border-ocean-100 px-4 py-3 hover:border-lagon-300"
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
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Music size={20} className="text-tipanier-600" />
            <h2 className="font-display text-xl text-ocean-950">Week-end à venir</h2>
          </div>
          {data.weekendEvents.length === 0 ? (
            <p className="text-sm text-ocean-600">Agenda week-end à compléter.</p>
          ) : (
            <ul className="space-y-2 text-sm text-ocean-700">
              {data.weekendEvents.slice(0, 5).map((e) => (
                <li key={e.slug}>
                  <Link href={`/evenements/${e.slug}`} className="hover:text-lagon-700">
                    {e.title}
                  </Link>
                  <span className="text-ocean-400"> — {e.location}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </>
  );
}
