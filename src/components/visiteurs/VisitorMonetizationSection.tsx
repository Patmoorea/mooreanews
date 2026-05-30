import Link from "next/link";
import { stripePublicEnabled, formatXpf, STRIPE_PRICES } from "@/lib/stripe";

const TIERS = [
  {
    title: "Référencement pension / fare",
    price: "Sur devis",
    desc: "Fiche dans l'annuaire visiteurs, badge quartier, lien contact.",
    href: "/commercant",
  },
  {
    title: "À la une visiteurs",
    price: `${formatXpf(STRIPE_PRICES.accommodationPremiumXpf)} / mois`,
    desc: "Top de la liste hébergements + QR pack hébergeur personnalisé.",
    href: "/commercant",
  },
  {
    title: "Boost annonce location",
    price: `${formatXpf(STRIPE_PRICES.announcementBoostXpf)} / 7 j`,
    desc: "Annonce location en tête — idéal fares et villas.",
    href: "/commercant",
  },
  {
    title: "Restaurant premium",
    price: `${formatXpf(STRIPE_PRICES.restaurantPremiumXpf)} / mois`,
    desc: "Mis en avant restos + carte touriste.",
    href: "/commercant",
  },
  {
    title: "Activité / excursion",
    price: "Sur devis",
    desc: "Plongée, quad, baleines — visibilité agenda & visiteurs.",
    href: "/contact",
  },
];

export function VisitorMonetizationSection() {
  const stripeOn = stripePublicEnabled();

  return (
    <section className="rounded-3xl bg-gradient-to-br from-ocean-900 to-ocean-950 text-white p-6 sm:p-8">
      <h2 className="font-display text-2xl">Professionnels & revenus</h2>
      <p className="mt-2 text-ocean-200 text-sm max-w-2xl">
        MooreaNews finance l&apos;info gratuite pour les visiteurs via des mises en
        avant locales. {stripeOn ? "Paiement en ligne disponible." : "Contactez-nous pour référencer votre établissement."}
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {TIERS.map((t) => (
          <li
            key={t.title}
            className="rounded-2xl bg-white/10 border border-white/10 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white">{t.title}</h3>
              <span className="text-xs font-bold text-lagon-200 shrink-0">
                {t.price}
              </span>
            </div>
            <p className="mt-2 text-xs text-ocean-200">{t.desc}</p>
            <Link
              href={t.href}
              className="inline-block mt-3 text-xs font-semibold text-lagon-300 hover:text-white"
            >
              En savoir plus →
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-ocean-400">
        Pack QR hôtel / ferry : imprimez la section QR ci-dessus ou le{" "}
        <Link href="/visiteurs/pack-hebergeur" className="text-lagon-300 underline">
          pack PDF hébergeur
        </Link>
        .
      </p>
    </section>
  );
}
