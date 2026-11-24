import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { AdSlot } from "@/components/ads/AdSlot";
import {
  RestaurantsDirectory,
  type RestaurantCardModel,
} from "@/components/restaurants/RestaurantsDirectory";
import { getRestaurants, restaurantToOpenMeta } from "@/lib/content";
import { listingPageMetadata } from "@/lib/seo";
import {
  resolveRestaurantOpenStatus,
  openStatusLabel,
  isOpenStatusConfigured,
} from "@/lib/restaurant-open-status";

/**
 * Une seule variante ISR. `?open=1` filtre dans le navigateur.
 * Le statut Google est recalculé au plus toutes les heures, ou via revalidatePath.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata = listingPageMetadata({
  title: "Restaurants de Moorea",
  description:
    "Tous les restaurants de Moorea : cuisine locale, gastronomique, brunch, roulottes. Trouvez votre table de l'île.",
  path: "/restaurants",
});

export default async function RestaurantsPage() {
  const all = await getRestaurants();
  const items: RestaurantCardModel[] = await Promise.all(
    all.map(async (r) => {
      const status = await resolveRestaurantOpenStatus(restaurantToOpenMeta(r));
      return {
        slug: r.slug,
        name: r.name,
        description: r.description,
        cuisine: r.cuisine,
        priceLevel: r.priceLevel,
        district: r.district,
        address: r.address,
        phone: r.phone,
        openingHours: r.openingHours,
        image: r.image,
        features: r.features,
        premium: r.premium,
        openState: status.state,
        statusLabel: status.state === "unknown" ? null : openStatusLabel(status.source),
      };
    }),
  );

  return (
    <>
      <PageHeader
        badge="Où manger"
        title="Restaurants de Moorea"
        description="De la roulotte au restaurant gastronomique, tous les bons plans pour se restaurer sur l'île."
        variant="tiare"
      />
      <Container className="py-12 sm:py-16">
        <RestaurantsDirectory
          items={items}
          googleOn={isOpenStatusConfigured()}
          topAd={<AdSlot slotId="restaurants-top" className="mb-8" />}
          inlineAd={<AdSlot slotId="restaurants-inline" />}
        />
      </Container>
    </>
  );
}
