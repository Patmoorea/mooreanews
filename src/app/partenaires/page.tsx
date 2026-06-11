import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { RaiTahitiSpotlight } from "@/components/RaiTahitiSpotlight";
import { SITE } from "@/lib/constants";
import {
  AD_PACKAGES,
  AD_PACKAGE_IDS,
  AD_PLACEMENT_CATALOG,
  packageFormatLabels,
} from "@/lib/ad-packages";
import { AD_FORMAT_LABELS } from "@/lib/ads-types";

export const metadata: Metadata = {
  title: "Annonceurs & partenaires",
  description:
    "Forfaits publicitaires MooreaNews : Essentiel, Ciblé, Premium. Grille emplacements × formats × tarifs indicatifs.",
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
] as const;

const PACKAGE_ACCENTS: Record<string, string> = {
  essentiel: "from-ocean-600 to-ocean-800",
  cible: "from-lagon-500 to-ocean-700",
  premium: "from-tiare-400 to-tiare-600",
};

function packageBadgeLabel(id: string): string {
  return AD_PACKAGES[id as keyof typeof AD_PACKAGES]?.name ?? id;
}

export default function PartenairesPage() {
  return (
    <>
      <PageHeader
        badge="Professionnels"
        title="Annonceurs & partenaires"
        description="Forfaits publicitaires clairs : chaque annonceur choisit un pack (Essentiel, Ciblé ou Premium). Mêmes règles pour tous — emplacements, formats et tarifs indicatifs ci-dessous."
        variant="lagon"
      />
      <Container className="py-12 sm:py-16">
        <RaiTahitiSpotlight />

        <p className="mt-8 text-sm text-ocean-600">
          * Tarifs indicatifs en francs CFP / mois, ajustables selon la durée et le
          visuel. Contact :{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="text-tiare-600 font-semibold hover:underline"
          >
            {SITE.email}
          </a>
        </p>

        <section
          id="devenir-annonceur"
          className="mt-10 rounded-3xl border border-lagon-200 bg-gradient-to-br from-lagon-50 to-ocean-50 p-6 sm:p-8"
        >
          <h2 className="font-display text-2xl text-ocean-950">
            Annonceurs — par où commencer ?
          </h2>
          <ol className="mt-4 space-y-4 text-sm text-ocean-800">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-950 text-white text-xs font-bold">
                1
              </span>
              <div>
                <p className="font-semibold text-ocean-950">Consulter les tarifs sur cette page</p>
                <p className="mt-1">
                  Forfaits{" "}
                  <a href="#forfaits" className="text-tiare-600 font-semibold hover:underline">
                    Essentiel · Ciblé · Premium
                  </a>{" "}
                  et{" "}
                  <a href="#grille" className="text-tiare-600 font-semibold hover:underline">
                    grille détaillée
                  </a>{" "}
                  (emplacement × format × prix à l&apos;unité). Lien à partager :{" "}
                  <a
                    href={`${SITE.url}/partenaires`}
                    className="text-tiare-600 font-semibold hover:underline break-all"
                  >
                    {SITE.url.replace(/^https:\/\//, "")}/partenaires
                  </a>
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-950 text-white text-xs font-bold">
                2
              </span>
              <div>
                <p className="font-semibold text-ocean-950">Demander votre forfait</p>
                <p className="mt-1">
                  Formulaire{" "}
                  <Link href="/contact" className="text-tiare-600 font-semibold hover:underline">
                    Contact
                  </Link>
                  , email{" "}
                  <a
                    href={`mailto:${SITE.email}?subject=${encodeURIComponent("Publicité MooreaNews — demande de forfait")}`}
                    className="text-tiare-600 font-semibold hover:underline"
                  >
                    {SITE.email}
                  </a>{" "}
                  ou WhatsApp. Indiquez le forfait souhaité, votre activité et le lien à afficher.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-950 text-white text-xs font-bold">
                3
              </span>
              <div>
                <p className="font-semibold text-ocean-950">Envoyer vos visuels</p>
                <p className="mt-1">
                  Une bannière par format inclus dans le forfait (dimensions exactes listées
                  dans le pack). Nous les mettons en ligne — pas d&apos;espace client à gérer
                  pour l&apos;instant : vous gardez vos fichiers, nous les affichons sur le site.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section id="forfaits" className="mt-10">
          <h2 className="font-display text-2xl text-ocean-950">
            Forfaits publicitaires
          </h2>
          <p className="mt-2 text-sm text-ocean-600 max-w-3xl">
            Vous payez un <strong>forfait</strong>, pas un traitement au cas par cas.
            Chaque forfait liste les emplacements inclus et le nombre de bannières
            à fournir (une par format IAB).
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {AD_PACKAGE_IDS.map((id) => {
              const pkg = AD_PACKAGES[id];
              return (
                <div
                  key={id}
                  className="bg-white rounded-3xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)] flex flex-col"
                >
                  <div className={`p-6 bg-gradient-to-br ${PACKAGE_ACCENTS[id]} text-white`}>
                    <p className="text-xs uppercase tracking-widest opacity-90">
                      Forfait
                    </p>
                    <h3 className="mt-1 font-display text-2xl">{pkg.name}</h3>
                    <p className="mt-1 text-sm opacity-90">{pkg.tagline}</p>
                    <p className="mt-3 text-lg font-semibold">
                      dès {pkg.fromXpf} XPF / mois*
                    </p>
                    <p className="mt-1 text-xs opacity-90">
                      {formatsForPackageCount(id)} bannière
                      {formatsForPackageCount(id) > 1 ? "s" : ""} à fournir
                    </p>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <ul className="space-y-2 text-sm text-ocean-700 flex-1">
                      {pkg.highlights.map((h) => (
                        <li key={h} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-lagon-500 flex-shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-ocean-100">
                      <p className="text-xs font-semibold text-ocean-500 uppercase tracking-wide">
                        Formats inclus
                      </p>
                      <ul className="mt-2 text-xs text-ocean-700 space-y-1">
                        {packageFormatLabels(id).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href="/contact"
                      className="mt-6 inline-flex items-center justify-center w-full px-5 py-3 rounded-full bg-ocean-950 text-white font-semibold hover:bg-ocean-900 transition-colors text-sm"
                    >
                      Demander le forfait {pkg.name}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
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

        <div id="grille" className="mt-12 rounded-3xl border border-ocean-100 bg-white overflow-hidden shadow-[var(--shadow-soft)]">
          <div className="px-6 py-4 bg-gradient-to-r from-lagon-50 to-ocean-50 border-b border-ocean-100">
            <h3 className="font-display text-xl text-ocean-950">
              Grille emplacements × formats × tarifs
            </h3>
            <p className="mt-1 text-sm text-ocean-600">
              Détail de chaque zone. Les colonnes Forfait indiquent dans quels packs
              l&apos;emplacement est inclus (mêmes conditions pour tous les
              annonceurs du pack).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-ocean-100 bg-ocean-50/50">
                  <th className="text-left font-semibold text-ocean-900 px-4 py-3">
                    Emplacement
                  </th>
                  <th className="text-left font-semibold text-ocean-900 px-4 py-3">
                    Format
                  </th>
                  <th className="text-left font-semibold text-ocean-900 px-4 py-3 hidden sm:table-cell">
                    Dimensions
                  </th>
                  <th className="text-left font-semibold text-ocean-900 px-4 py-3 hidden md:table-cell">
                    Zone
                  </th>
                  <th className="text-left font-semibold text-ocean-900 px-4 py-3 hidden lg:table-cell">
                    Forfaits
                  </th>
                  <th className="text-right font-semibold text-ocean-900 px-4 py-3">
                    À l&apos;unité*
                  </th>
                </tr>
              </thead>
              <tbody>
                {AD_PLACEMENT_CATALOG.map((row) => (
                  <tr key={row.id} className="border-b border-ocean-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-ocean-900">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-ocean-600">
                      {AD_FORMAT_LABELS[row.format]}
                    </td>
                    <td className="px-4 py-3 text-ocean-600 hidden sm:table-cell font-mono text-xs">
                      {row.dimensions}
                    </td>
                    <td className="px-4 py-3 text-ocean-600 hidden md:table-cell">
                      {row.zone}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {row.packages.map((p) => (
                          <Badge key={p} variant={p === "premium" ? "tiare" : "lagon"}>
                            {packageBadgeLabel(p)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-ocean-800 font-semibold whitespace-nowrap">
                      {row.fromXpf} XPF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-ocean-100 bg-white p-6 sm:p-8">
          <h3 className="font-display text-2xl text-ocean-950">
            Informations à fournir
          </h3>
          <p className="mt-2 text-ocean-700">
            Forfait choisi, nom, activité, lien (site / Facebook), texte alternatif,
            et une bannière par format inclus (dimensions exactes indiquées dans
            le forfait).
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

function formatsForPackageCount(id: string): number {
  return AD_PACKAGES[id as keyof typeof AD_PACKAGES]?.formats.filter(
    (f) => f !== "sidebar",
  ).length ?? 0;
}
