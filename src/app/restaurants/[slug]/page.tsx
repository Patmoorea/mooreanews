import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Star,
  Utensils,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShareButtons } from "@/components/ShareButtons";
import { RestaurantPriceLevel } from "@/components/RestaurantPriceLevel";
import { getRestaurantPriceLevelDisplay } from "@/lib/content-labels";
import { getRestaurantBySlug, getRestaurants } from "@/lib/content";
import { SITE } from "@/lib/constants";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const restaurants = await getRestaurants();
  return restaurants.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return { title: "Restaurant introuvable" };
  return {
    title: `${restaurant.name} — Restaurant à ${restaurant.district}`,
    description: restaurant.description,
    alternates: { canonical: `/restaurants/${restaurant.slug}` },
    openGraph: {
      title: restaurant.name,
      description: restaurant.description,
      type: "website",
    },
  };
}

export default async function RestaurantDetailPage({ params }: Props) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const all = await getRestaurants();
  const related = all
    .filter((r) => r.slug !== restaurant.slug && r.district === restaurant.district)
    .slice(0, 3);

  const shareUrl = `${SITE.url}/restaurants/${restaurant.slug}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${restaurant.name}, ${restaurant.address}, ${restaurant.district}, Moorea, Polynésie française`,
  )}`;

  return (
    <article>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-tiare-100 via-soleil-50 to-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-tapa opacity-30 pointer-events-none"
        />
        <Container className="relative py-12 sm:py-16">
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 text-sm text-ocean-600 hover:text-tiare-600 mb-6"
          >
            <ArrowLeft size={16} />
            Tous les restaurants
          </Link>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {restaurant.premium && (
              <Badge variant="soleil" icon={<Star size={10} />}>
                Premium
              </Badge>
            )}
            <Badge variant="lagon">{restaurant.district}</Badge>
            {restaurant.cuisine.slice(0, 3).map((c) => (
              <Badge key={c} variant="neutral">
                {c}
              </Badge>
            ))}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-balance leading-[1.1] text-ocean-950">
            {restaurant.name}
          </h1>

          <div className="mt-3 flex items-center gap-3 text-ocean-600">
            <RestaurantPriceLevel
              level={restaurant.priceLevel}
              variant="full"
              className="text-lg"
            />
            <span className="text-ocean-400">·</span>
            <span className="flex items-center gap-1.5">
              <Utensils size={14} className="text-tiare-500" />
              {restaurant.cuisine.join(", ")}
            </span>
          </div>

          <p className="mt-6 text-lg text-ocean-700 max-w-3xl text-pretty">
            {restaurant.description}
          </p>
        </Container>
      </section>

      {/* Infos + actions */}
      <Container size="narrow" className="py-10 sm:py-14">
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoTile icon={<MapPin size={16} />} label="Adresse">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-tiare-600 transition-colors"
            >
              {restaurant.address}
              <br />
              <span className="text-ocean-500">{restaurant.district}, Moorea</span>
            </a>
          </InfoTile>
          {restaurant.phone && (
            <InfoTile icon={<Phone size={16} />} label="Téléphone">
              <a
                href={`tel:${restaurant.phone.replace(/\s+/g, "")}`}
                className="hover:text-tiare-600 transition-colors"
              >
                {restaurant.phone}
              </a>
            </InfoTile>
          )}
          {restaurant.openingHours && (
            <InfoTile icon={<Clock size={16} />} label="Horaires">
              {restaurant.openingHours}
            </InfoTile>
          )}
          {restaurant.website && (
            <InfoTile icon={<ExternalLink size={16} />} label="Site web">
              <a
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-tiare-600 hover:underline break-all"
              >
                {restaurant.website}
              </a>
            </InfoTile>
          )}
        </div>

        {restaurant.features && restaurant.features.length > 0 && (
          <div className="mt-8 p-5 rounded-2xl bg-lagon-50 border border-lagon-100">
            <h2 className="font-display text-lg text-ocean-900 mb-3">
              Services & ambiance
            </h2>
            <div className="flex flex-wrap gap-2">
              {restaurant.features.map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 rounded-full bg-white border border-lagon-200 text-sm text-ocean-700"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-10 flex flex-wrap gap-3">
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white font-semibold shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-transform"
            >
              <Phone size={18} />
              Réserver par téléphone
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-ocean-800 font-semibold border-2 border-ocean-200 hover:border-tiare-400 transition-colors"
          >
            <MapPin size={18} />
            Itinéraire
          </a>
        </div>

        {/* Partage */}
        <div className="mt-10 pt-8 border-t border-ocean-100">
          <ShareButtons
            url={shareUrl}
            title={restaurant.name}
            description={restaurant.description.slice(0, 140)}
          />
        </div>
      </Container>

      {/* Autres restaurants du district */}
      {related.length > 0 && (
        <section className="py-14 bg-gradient-to-b from-ocean-50 to-white">
          <Container>
            <h2 className="font-display text-2xl sm:text-3xl text-ocean-950 mb-8">
              Autres tables à {restaurant.district}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/restaurants/${r.slug}`}
                  className="group bg-white rounded-2xl border border-ocean-100 p-5 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-display text-lg text-ocean-900 group-hover:text-tiare-600 transition-colors">
                      {r.name}
                    </h3>
                    <RestaurantPriceLevel
                      level={r.priceLevel}
                      className="text-sm"
                    />
                  </div>
                  <p className="text-sm text-ocean-600 line-clamp-2">
                    {r.description}
                  </p>
                  <div className="mt-3 text-xs text-ocean-500">
                    {r.cuisine.slice(0, 2).join(" · ")}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* JSON-LD Restaurant */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: restaurant.name,
            description: restaurant.description,
            servesCuisine: restaurant.cuisine,
            priceRange: getRestaurantPriceLevelDisplay(restaurant.priceLevel)
              .schemaPriceRange,
            telephone: restaurant.phone,
            url: restaurant.website ?? shareUrl,
            address: {
              "@type": "PostalAddress",
              streetAddress: restaurant.address,
              addressLocality: restaurant.district,
              addressRegion: "Polynésie française",
              addressCountry: "PF",
            },
            openingHours: restaurant.openingHours,
          }),
        }}
      />
    </article>
  );
}

function InfoTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-lagon-50 border border-lagon-100">
      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-white text-tiare-500 flex items-center justify-center shadow-sm">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-ocean-500 font-medium">
          {label}
        </div>
        <div className="text-sm text-ocean-900 mt-0.5">{children}</div>
      </div>
    </div>
  );
}
