import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Clock, Star, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { RestaurantPriceLevel } from "@/components/RestaurantPriceLevel";
import { getRestaurants } from "@/lib/content";

export const metadata: Metadata = {
  title: "Restaurants de Moorea",
  description:
    "Tous les restaurants de Moorea : cuisine locale, gastronomique, brunch, roulottes. Trouvez votre table de l'île.",
};

export default async function RestaurantsPage() {
  const items = await getRestaurants();

  return (
    <>
      <PageHeader
        badge="Où manger"
        title="Restaurants de Moorea"
        description="De la roulotte au restaurant gastronomique, tous les bons plans pour se restaurer sur l'île."
        variant="tiare"
      />
      <Container className="py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {items.map((r) => (
            <article
              key={r.slug}
              className="group relative bg-white rounded-2xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:border-tiare-200 hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row"
            >
              <Link
                href={`/restaurants/${r.slug}`}
                className="absolute inset-0 z-10"
                aria-label={`Voir ${r.name}`}
              />
              <div className="sm:w-48 aspect-[16/10] sm:aspect-auto bg-gradient-to-br from-tiare-200 via-soleil-200 to-couchant/40 relative flex-shrink-0">
                {r.premium && (
                  <div className="absolute top-3 left-3">
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
          ))}
        </div>
      </Container>
    </>
  );
}
