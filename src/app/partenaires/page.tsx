import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Annonceurs & partenaires",
  description:
    "Informations pour les professionnels : publier sur MooreaNews, mises en avant et partenariats.",
  alternates: { canonical: "/partenaires" },
};

const OFFERS = [
  {
    title: "Annonce & événement",
    price: "Gratuit",
    badge: "Pour tous",
    bullets: [
      "Publiez un événement, une annonce ou un service via le formulaire",
      "Validation sous 24h pour éviter spam / arnaques",
      "Visible sur le site (Annonces / Événements) et partageable",
    ],
    ctaHref: "/soumettre",
    ctaLabel: "Publier une info",
    accent: "from-lagon-500 to-ocean-700",
  },
  {
    title: "Mise en avant « Premium »",
    price: "Sur demande",
    badge: "Commerces",
    bullets: [
      "Badge Premium + remontée en haut de liste (restaurants, pages dédiées)",
      "Ajout d'une image de couverture et d'un lien direct",
      "Durée flexible (semaine / mois / saison)",
    ],
    ctaHref: "/contact",
    ctaLabel: "Demander un devis",
    accent: "from-soleil-400 to-couchant",
  },
  {
    title: "Partenariat / encart",
    price: "Sur demande",
    badge: "Soutien local",
    bullets: [
      "Encart partenaire (ex. accueil, page infos pratiques, opérations locales)",
      "Communication événementielle (associations, campagnes, journées)",
      "Charte : pas de publicité intrusive, priorité à l’intérêt local",
    ],
    ctaHref: "/contact",
    ctaLabel: "Nous contacter",
    accent: "from-tiare-400 to-tiare-600",
  },
] as const;

export default function PartenairesPage() {
  return (
    <section className="py-14 sm:py-18 bg-gradient-to-b from-ocean-50 via-lagon-50 to-white">
      <Container>
        <div className="max-w-3xl">
          <Badge variant="lagon">Professionnels</Badge>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl text-ocean-950">
            Annonceurs & partenaires
          </h1>
          <p className="mt-4 text-lg text-ocean-700">
            MooreaNews privilégie l&apos;utilité locale. Les annonces et événements
            sont <strong>gratuits</strong>. Les mises en avant (Premium / encarts)
            se font <strong>sur demande</strong>, sans paiement en ligne pour
            l&apos;instant.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {OFFERS.map((o) => (
            <div
              key={o.title}
              className="bg-white rounded-3xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)]"
            >
              <div className={`p-6 bg-gradient-to-br ${o.accent} text-white`}>
                <p className="text-xs uppercase tracking-widest opacity-90">
                  {o.badge}
                </p>
                <h2 className="mt-2 font-display text-2xl">{o.title}</h2>
                <p className="mt-2 text-lg font-semibold">{o.price}</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-sm text-ocean-700">
                  {o.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-lagon-500 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href={o.ctaHref}
                    className="inline-flex items-center justify-center w-full px-5 py-3 rounded-full bg-ocean-950 text-white font-semibold hover:bg-ocean-900 transition-colors"
                  >
                    {o.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-ocean-100 bg-white p-6 sm:p-8">
          <h3 className="font-display text-2xl text-ocean-950">
            Informations à fournir
          </h3>
          <p className="mt-2 text-ocean-700">
            Pour une mise en avant : nom, activité, zone (district), lien (site /
            Facebook), visuel (photo) et durée souhaitée.
          </p>
        </div>
      </Container>
    </section>
  );
}

