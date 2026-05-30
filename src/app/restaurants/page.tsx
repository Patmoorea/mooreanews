import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Clock, Star, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { RestaurantPriceLevel } from "@/components/RestaurantPriceLevel";
import { PublicationCover } from "@/components/PublicationCover";
import { getRestaurants, restaurantToOpenMeta } from "@/lib/content";
import {
  listOpenRestaurantsNow,
  resolveRestaurantOpenStatus,
  openStatusLabel,
  OPEN_STATUS_HELP,
  isOpenStatusConfigured,
} from "@/lib/restaurant-open-status";

export const metadata: Metadata = {
  title: "Restaurants de Moorea",
  description:
    "Tous les restaurants de Moorea : cuisine locale, gastronomique, brunch, roulottes. Trouvez votre table de l'île.",
};

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  const openOnly = open === "1" || open === "true";
  const all = await getRestaurants();
  const metas = all.map(restaurantToOpenMeta);
  const verifiedOpen = await listOpenRestaurantsNow(metas);
  const openSlugs = new Set(verifiedOpen.map((r) => r.slug));
  const items = openOnly ? all.filter((r) => openSlugs.has(r.slug)) : all;

  const statusBySlug = new Map(
    await Promise.all(
      all.map(async (r) => {
        const status = await resolveRestaurantOpenStatus(restaurantToOpenMeta(r));
        return [r.slug, status] as const;
      }),
    ),
  );

  const googleOn = isOpenStatusConfigured();

  return (
    <>
      <PageHeader
        badge="Où manger"
        title="Restaurants de Moorea"
        description="De la roulotte au restaurant gastronomique, tous les bons plans pour se restaurer sur l'île."
        variant="tiare"
      />
      <Container className="py-12 sm:py-16">
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/restaurants"
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !openOnly
                ? "bg-lagon-600 text-white"
                : "bg-ocean-100 text-ocean-700 hover:bg-ocean-200"
            }`}
          >
            Tous
          </Link>
          <Link
            href="/restaurants?open=1"
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              openOnly
                ? "bg-tipanier-600 text-white"
                : "bg-ocean-100 text-ocean-700 hover:bg-ocean-200"
            }`}
          >
            Ouverts maintenant
            {verifiedOpen.length > 0 ? ` (${verifiedOpen.length})` : ""}
          </Link>
        </div>

        {openOnly && (
          <p className="mb-6 rounded-xl border border-lagon-200 bg-lagon-50 px-4 py-3 text-sm text-lagon-900">
            {OPEN_STATUS_HELP}
            {!googleOn && (
              <>
                {" "}
                Configurez <code className="text-xs">GOOGLE_PLACES_API_KEY</code> sur
                Vercel et renseignez les Place ID dans l&apos;admin, ou demandez aux
                commerçants de déclarer leur statut.
              </>
            )}
          </p>
        )}

        {openOnly && items.length === 0 && (
          <p className="text-center text-ocean-600 py-12">
            Aucun restaurant confirmé ouvert pour l&apos;instant. Les statuts viennent de
            Google Maps (Place ID) ou d&apos;une déclaration commerçant du jour — pas
            d&apos;estimation à partir du texte horaires.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {items.map((r) => {
            const status = statusBySlug.get(r.slug);
            const isOpen = status?.state === "open";
            const isClosed = status?.state === "closed";
            return (
              <article
                key={r.slug}
                className="group relative bg-white rounded-2xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:border-tiare-200 hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row"
              >
                <Link
                  href={`/restaurants/${r.slug}`}
                  className="absolute inset-0 z-10"
                  aria-label={`Voir ${r.name}`}
                />
                <div className="relative sm:w-48 flex-shrink-0">
                  <PublicationCover
                    src={r.image}
                    alt={r.name}
                    category="restaurants"
                    slug={r.slug}
                    className="w-full aspect-[16/10] sm:aspect-auto sm:min-h-[140px]"
                    sizes="(max-width: 640px) 100vw, 192px"
                  />
                  {isOpen && status && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge variant="tipanier">
                        Ouvert · {openStatusLabel(status.source)}
                      </Badge>
                    </div>
                  )}
                  {isClosed && status && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge variant="neutral">
                        Fermé · {openStatusLabel(status.source)}
                      </Badge>
                    </div>
                  )}
                  {r.premium && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant="soleil" icon={<Star size={10} />}>
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 relative">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="font-display text-xl text-ocean-900 group-hover:text-tiare-600 transition-colors">
                      {r.name}
                    </h2>
                    <RestaurantPriceLevel level={r.priceLevel} />
                  </div>
                  <p className="text-sm text-ocean-700">{r.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.cuisine.map((c) => (
                      <Badge key={c} variant="neutral">
                        {c}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-ocean-600">
                    <p className="flex items-center gap-1.5">
                      <MapPin size={12} />
                      {r.address}, {r.district}
                    </p>
                    {r.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone size={12} />
                        <a
                          href={`tel:${r.phone.replace(/\s+/g, "")}`}
                          className="hover:text-tiare-600"
                        >
                          {r.phone}
                        </a>
                      </p>
                    )}
                    {r.openingHours && (
                      <p className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {r.openingHours}
                      </p>
                    )}
                  </div>

                  {r.features && r.features.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-ocean-100 flex flex-wrap gap-1.5">
                      {r.features.map((f) => (
                        <span
                          key={f}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-lagon-50 text-lagon-700"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-tiare-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Voir la fiche
                    <ArrowRight size={12} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </>
  );
}
