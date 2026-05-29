import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { CommercantForm } from "@/components/commerce/CommercantForm";
import { PremiumRestaurantButton } from "@/components/commerce/PremiumRestaurantButton";
import { getRestaurants } from "@/lib/content";
import { stripePublicEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Espace commerçant",
  description:
    "Restaurants et commerces Moorea : menu du jour, premium et visibilité sur MooreaNews.",
};

type Props = { searchParams: Promise<{ premium?: string }> };

export default async function CommercantPage({ searchParams }: Props) {
  const { premium } = await searchParams;
  const restaurants = await getRestaurants();
  const stripeOn = stripePublicEnabled();

  return (
    <div className="min-h-screen bg-island-sky py-12 sm:py-16">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl text-ocean-950">
          Espace commerçant
        </h1>
        <p className="mt-4 text-ocean-700">
          Publiez votre menu du jour, vos horaires et boostez votre visibilité sur
          MooreaNews.
        </p>

        {premium === "success" && (
          <p className="mt-4 rounded-2xl bg-tipanier-50 border border-tipanier-200 p-4 text-sm text-tipanier-800">
            Paiement reçu — votre fiche premium sera activée sous quelques minutes.
          </p>
        )}

        <section className="mt-10">
          <h2 className="font-display text-xl text-ocean-900 mb-4">
            Demande gratuite (modération)
          </h2>
          <CommercantForm />
        </section>

        {stripeOn && restaurants.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl text-ocean-900 mb-4">
              Premium restaurant (paiement en ligne)
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
            <p className="mt-4 text-xs text-ocean-500">
              Votre restaurant n&apos;apparaît pas ?{" "}
              <Link href="/contact" className="underline">
                Contactez-nous
              </Link>
              .
            </p>
          </section>
        )}

        {!stripeOn && (
          <p className="mt-8 text-sm text-ocean-500">
            Paiement en ligne bientôt disponible — utilisez le formulaire ci-dessus.
          </p>
        )}
      </Container>
    </div>
  );
}
