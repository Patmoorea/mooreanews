import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { CommercantForm } from "@/components/commerce/CommercantForm";
import { PremiumRestaurantButton } from "@/components/commerce/PremiumRestaurantButton";
import { PremiumAccommodationButton } from "@/components/commerce/PremiumAccommodationButton";
import { getRestaurants } from "@/lib/content";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { stripePublicEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Espace commerçant",
  description:
    "Restaurants, hébergements et commerces Moorea : premium et visibilité sur MooreaNews.",
};

type Props = {
  searchParams: Promise<{ premium?: string; accommodation_premium?: string }>;
};

export default async function CommercantPage({ searchParams }: Props) {
  const params = await searchParams;
  const restaurants = await getRestaurants();
  const stripeOn = stripePublicEnabled();

  const admin = getAdminSupabase();
  const { data: accommodations } = admin
    ? await admin
        .from("accommodations")
        .select("id, name")
        .eq("published", true)
        .order("name")
    : { data: [] };

  return (
    <div className="min-h-screen bg-island-sky py-12 sm:py-16">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl text-ocean-950">
          Espace commerçant
        </h1>
        <p className="mt-4 text-ocean-700">
          Publiez votre activité, boostez une annonce ou passez en premium sur
          MooreaNews (restaurants & hébergements).
        </p>

        {params.premium === "success" && (
          <p className="mt-4 rounded-2xl bg-tipanier-50 border border-tipanier-200 p-4 text-sm text-tipanier-800">
            Paiement reçu — votre fiche restaurant premium sera activée sous quelques minutes.
          </p>
        )}
        {params.accommodation_premium === "success" && (
          <p className="mt-4 rounded-2xl bg-soleil-50 border border-soleil-200 p-4 text-sm text-soleil-800">
            Paiement reçu — votre hébergement sera mis à la une visiteurs sous quelques minutes.
          </p>
        )}

        <section className="mt-10">
          <h2 className="font-display text-xl text-ocean-900 mb-4">
            Demande gratuite (modération)
          </h2>
          <CommercantForm />
        </section>

        {stripeOn && (accommodations?.length ?? 0) > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl text-ocean-900 mb-4">
              Premium hébergement (49 € / 30 j)
            </h2>
            <p className="text-sm text-ocean-600 mb-4">
              Top de{" "}
              <Link href="/visiteurs" className="text-lagon-700 underline">
                /visiteurs
              </Link>{" "}
              et annuaire hébergements.
            </p>
            <div className="space-y-4">
              {(accommodations ?? []).slice(0, 12).map((a) => (
                <PremiumAccommodationButton
                  key={a.id}
                  accommodationId={a.id}
                  accommodationName={a.name}
                />
              ))}
            </div>
          </section>
        )}

        {stripeOn && restaurants.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl text-ocean-900 mb-4">
              Premium restaurant (49 € / 30 j)
            </h2>
            <div className="space-y-4">
              {restaurants.slice(0, 8).map((r) => (
                <PremiumRestaurantButton
                  key={r.slug}
                  restaurantId={r.slug}
                  restaurantName={r.name}
                />
              ))}
            </div>
          </section>
        )}

        {!stripeOn && (
          <p className="mt-8 text-sm text-ocean-500">
            Paiement en ligne bientôt disponible — utilisez le formulaire ci-dessus ou{" "}
            <Link href="/contact" className="underline">
              contactez-nous
            </Link>
            .
          </p>
        )}
      </Container>
    </div>
  );
}
