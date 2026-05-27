import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { MOOREA_ASSOCIATIONS, MOOREA_COMMUNITY_LINKS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Associations & collectifs — MooreaNews",
  description:
    "Associations, fédérations et collectifs qui œuvrent pour Moorea : environnement, culture, jeunesse, protection du lagon.",
};

export default function AssociationsPage() {
  return (
    <>
      <PageHeader
        badge="Vie locale"
        title="Associations & collectifs"
        description="Culture, lagon, jeunesse, environnement : les acteurs locaux à connaître et à contacter."
        variant="tipanier"
      />

      <Container className="py-12 sm:py-16">
        <p className="text-ocean-700 max-w-2xl">
          MooreaNews recense les structures qui font vivre l&apos;île. Vous en
          connaissez une autre ?{" "}
          <Link
            href="/contact"
            className="text-tiare-600 font-semibold hover:underline"
          >
            Contactez-nous
          </Link>{" "}
          ou{" "}
          <Link
            href="/soumettre"
            className="text-tiare-600 font-semibold hover:underline"
          >
            proposez une info
          </Link>
          .
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {MOOREA_ASSOCIATIONS.map((link) => (
            <li key={`${link.href}-${link.title}`}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col h-full p-5 rounded-2xl bg-white border border-ocean-100 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] transition-all"
              >
                <span className="font-display text-xl text-ocean-900 inline-flex items-center gap-2">
                  {link.title}
                  <ExternalLink size={16} className="text-ocean-400 shrink-0" />
                </span>
                <span className="mt-2 text-sm text-ocean-700 leading-relaxed">
                  {link.description}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <section className="mt-14 pt-10 border-t border-ocean-100">
          <h2 className="font-display text-2xl text-ocean-950">
            Liens utiles & veille
          </h2>
          <p className="mt-2 text-sm text-ocean-700 max-w-2xl">
            Commune, groupe Facebook, ferries, RAI TAHITI — aussi sur la page{" "}
            <Link
              href="/infos-pratiques#communaute"
              className="text-tiare-600 font-semibold hover:underline"
            >
              Infos pratiques
            </Link>{" "}
            et les{" "}
            <Link
              href="/actualites"
              className="text-tiare-600 font-semibold hover:underline"
            >
              actualités agrégées
            </Link>
            .
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {MOOREA_COMMUNITY_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-xl bg-lagon-50 border border-lagon-100 hover:border-tiare-300 transition-colors text-sm"
                >
                  <span className="font-semibold text-ocean-900">
                    {link.title}
                  </span>
                  <span className="mt-1 block text-ocean-600">
                    {link.description}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
