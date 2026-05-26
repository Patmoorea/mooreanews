import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { getActivities } from "@/lib/content";
import { Mountain, MapPin, Phone, Star, Clock } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("activities") };
}

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activities = getActivities();

  return (
    <div className="tropical-bg min-h-screen">
      <div className="bg-gradient-to-br from-lagoon-500 via-lagoon-700 to-deep-800 text-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Mountain className="h-10 w-10 mb-4 opacity-80" />
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            Quoi faire à Moorea
          </h1>
          <p className="text-white/85 text-lg max-w-2xl">
            Plongée, randonnée, lagon, baleines, quad… L'île regorge
            d'aventures à vivre.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((a) => (
            <article
              key={a.slug}
              className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={a.image}
                  alt={a.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-deep-900 shadow-md">
                  <Star className="h-3 w-3 fill-sand-400 text-sand-400" />
                  {a.rating}
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] uppercase tracking-wider font-semibold">
                    {a.category}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h2 className="font-display text-xl text-deep-900 mb-1 group-hover:text-lagoon-700 transition-colors">
                  {a.name}
                </h2>
                <p className="text-xs text-hibiscus-600 font-semibold mb-2">
                  par {a.provider}
                </p>
                <p className="text-sm text-muted mb-3 line-clamp-2">
                  {a.description}
                </p>
                {a.seasonal && (
                  <div className="inline-block px-2 py-0.5 rounded-full bg-sand-100 text-sand-900 text-[10px] uppercase tracking-wider font-semibold mb-3">
                    🌟 {a.seasonal}
                  </div>
                )}
                <div className="space-y-1.5 text-xs text-muted pt-3 border-t border-lagoon-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-hibiscus-600">
                      {a.price}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.duration}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {a.location}
                  </div>
                  {a.phone && (
                    <a
                      href={`tel:${a.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-lagoon-700 hover:text-lagoon-900 transition-colors font-medium"
                    >
                      <Phone className="h-3 w-3" />
                      {a.phone}
                    </a>
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
