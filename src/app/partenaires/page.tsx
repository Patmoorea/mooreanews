import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { RaiTahitiSpotlight } from "@/components/RaiTahitiSpotlight";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Annonceurs & partenaires",
  description:
    "Tarifs indicatifs pour publier sur MooreaNews : annonces gratuites, mises en avant Premium et encarts partenaires locaux.",
  alternates: { canonical: "/partenaires" },
};

const OFFERS = [
  {
    title: "Annonce & événement",
    price: "Gratuit",
    priceDetail: "0 XPF",
    badge: "Pour tous",
    bullets: [
      "Événement, annonce, service ou signalement via le formulaire",
      "Validation sous 24h (anti-spam)",
      "Visible sur Annonces / Événements et partageable",
    ],
    ctaHref: "/soumettre",
    ctaLabel: "Publier une info",
    accent: "from-lagon-500 to-ocean-700",
  },
  {
    title: "Restaurant / activité Premium",
    price: "Sur devis",
    priceDetail: "à partir de ~15 000 XPF / mois*",
    badge: "Commerces",
    bullets: [
      "Badge Premium + remontée en tête de liste",
      "Photo de couverture + lien site / Facebook",
      "Durée flexible : semaine, mois ou saison",
    ],
    ctaHref: "/contact",
    ctaLabel: "Demander un devis",
    accent: "from-soleil-400 to-couchant",
  },
  {
    title: "Encart partenaire",
    price: "Sur devis",
    priceDetail: "à partir de ~25 000 XPF / mois*",
    badge: "Visibilité locale",
    bullets: [
      "Encart sur l’accueil, Infos pratiques ou page dédiée",
      "Idéal associations, campagnes, services utiles à l’île",
      "Charte : pas de pub intrusive, priorité à l’intérêt local",
    ],
    ctaHref: "/contact",
    ctaLabel: "Nous contacter",
    accent: "from-tiare-400 to-tiare-600",
  },
] as const;

const PRICING_ROWS = [
  { label: "Publication communautaire", value: "Gratuit" },
  { label: "Mise en avant Premium (restaurant / activité)", value: "Sur devis (~15 000 XPF/mois*)" },
  { label: "Encart partenaire (accueil ou rubrique)", value: "Sur devis (~25 000 XPF/mois*)" },
  { label: "Paiement en ligne", value: "Non — facturation / virement sur accord" },
] as const;

export default function PartenairesPage() {
  return (
    <>
      <PageHeader
        badge="Professionnels"
        title="Annonceurs & partenaires"
        description="MooreaNews privilégie l’utilité locale. Les annonces sont gratuites ; les mises en avant et encarts se font sur demande, avec des tarifs indicatifs transparents."
        variant="lagon"
      />
      <Container className="py-12 sm:py-16">
        <RaiTahitiSpotlight />

        <p className="mt-8 text-sm text-ocean-600">
          * Tarifs indicatifs en francs CFP, ajustables selon la durée, la zone
          d’affichage et le visuel. Contact :{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="text-tiare-600 font-semibold hover:underline"
          >
            {SITE.email}
          </a>
        </p>

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
                <p className="text-sm opacity-90">{o.priceDetail}</p>
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

        <div className="mt-10 rounded-3xl border border-ocean-100 bg-white overflow-hidden shadow-[var(--shadow-soft)]">
          <div className="px-6 py-4 bg-ocean-50 border-b border-ocean-100">
            <h3 className="font-display text-xl text-ocean-950">
              Grille tarifaire indicative
            </h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {PRICING_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-ocean-100 last:border-0">
                  <th className="text-left font-medium text-ocean-900 px-6 py-4 align-top w-1/2">
                    {row.label}
                  </th>
                  <td className="px-6 py-4 text-ocean-700">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 rounded-3xl border border-ocean-100 bg-white p-6 sm:p-8">
          <h3 className="font-display text-2xl text-ocean-950">
            Informations à fournir
          </h3>
          <p className="mt-2 text-ocean-700">
            Pour une mise en avant : nom, activité, district, lien (site /
            Facebook), visuel (photo) et durée souhaitée.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex px-5 py-2.5 rounded-full bg-ocean-950 text-white font-semibold hover:bg-ocean-900"
            >
              Demander un devis
            </Link>
            <Link
              href="/soumettre"
              className="inline-flex px-5 py-2.5 rounded-full border border-ocean-200 text-ocean-800 font-semibold hover:bg-ocean-50"
            >
              Publier gratuitement
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
