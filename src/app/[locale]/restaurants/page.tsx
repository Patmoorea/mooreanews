import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { getRestaurants } from "@/lib/content";
import { UtensilsCrossed, MapPin, Phone, Star } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("restaurants") };
}

export default async function RestaurantsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const restaurants = getRestaurants();

  return (
    <div className="tropical-bg min-h-screen">
      <div className="bg-gradient-to-br from-palm-500 via-palm-600 to-lagoon-700 text-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <UtensilsCrossed className="h-10 w-10 mb-4 opacity-80" />
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            Où manger à Moorea
          </h1>
          <p className="text-white/85 text-lg max-w-2xl">
            Restaurants, snacks, roulottes et tables gastronomiques. Saveurs
            polynésiennes et cuisines du monde.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((r) => (
            <article
              key={r.slug}
              className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={r.image}
                  alt={r.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-deep-900 shadow-md">
                  <Star className="h-3 w-3 fill-sand-400 text-sand-400" />
                  {r.rating}
                </div>
                <div className="absolute top-3 left-3 bg-deep-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                  {r.priceRange}
                </div>
              </div>
              <div className="p-5">
                <span className="text-[10px] uppercase tracking-wider text-hibiscus-600 font-semibold">
                  {r.type}
                </span>
                <h2 className="font-display text-xl text-deep-900 mt-1 mb-2 group-hover:text-lagoon-700 transition-colors">
                  {r.name}
                </h2>
                <p className="text-sm text-muted mb-3 line-clamp-2">
                  {r.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-lagoon-700 mb-3">
                  <span className="font-semibold">Spécialité :</span>
                  <span>{r.specialty}</span>
                </div>
                <div className="space-y-1.5 text-xs text-muted pt-3 border-t border-lagoon-100">
                  <div className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {r.location}
                  </div>
                  {r.phone && (
                    <div>
                      <a
                        href={`tel:${r.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-lagoon-700 hover:text-lagoon-900 transition-colors font-medium"
                      >
                        <Phone className="h-3 w-3" />
                        {r.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
