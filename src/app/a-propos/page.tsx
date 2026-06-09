import type { Metadata } from "next";
import Link from "next/link";
import {
  Heart,
  Globe,
  Zap,
  Users,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { staticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = staticPageMetadata({
  title: "À propos — MooreaNews",
  description:
    "MooreaNews, l'info de Moorea en Polynésie française : un projet communautaire, gratuit, automatisé pour centraliser toute l'info de l'île.",
  path: "/a-propos",
});

const VALUES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Heart,
    title: "Local et indépendant",
    desc: "Pensé par et pour les habitants de Moorea, sans tutelle commerciale.",
  },
  {
    icon: Globe,
    title: "100% gratuit",
    desc: "Lire, publier, s'inscrire : tout est gratuit, sans publicité intrusive.",
  },
  {
    icon: Zap,
    title: "Automatisé",
    desc: "Données live (météo, ferries, marées) mises à jour automatiquement chaque heure.",
  },
  {
    icon: Users,
    title: "Communautaire",
    desc: "Chaque habitant peut publier événements, annonces, services en quelques clics.",
  },
  {
    icon: Shield,
    title: "Modéré",
    desc: "Validation manuelle sous 24h pour garder un contenu propre et utile.",
  },
  {
    icon: Sparkles,
    title: "Polynésien",
    desc: "Design tropical inspiré du lagon, du tiare et du coucher de soleil sur le motu.",
  },
];

export default function AProposPage() {
  return (
    <>
      <PageHeader
        badge="Notre projet"
        title="Une île, un portail, une communauté"
        description="MooreaNews remplace l'ancien mooreanews.com par une plateforme moderne, vivante et automatisée pour rassembler toute l'info de l'île au même endroit."
        variant="tipanier"
      />

      <Container size="narrow" className="py-12 sm:py-16">
        <div className="prose-tropical space-y-6 text-lg text-ocean-800 leading-relaxed">
          <p>
            <strong>Ia ora na</strong> — bienvenue sur MooreaNews, le portail
            communautaire de notre île.
          </p>
          <p>
            Pendant des années, <em>mooreanews.com</em> a été le site
            d&apos;information de référence pour Moorea. Mais le temps a passé,
            le site est tombé en désuétude, et l&apos;information de l&apos;île
            s&apos;est éparpillée entre dizaines de pages Facebook, groupes
            WhatsApp et bouches-à-oreille.
          </p>
          <p>
            <strong>MooreaNews renaît cet héritage</strong> avec une plateforme
            moderne, multilingue, automatisée et pensée pour l&apos;ère
            mobile. Notre objectif : permettre à chacun, en quelques secondes,
            de connaître la météo, les horaires de ferries, les événements du
            week-end, les bons restaurants, les annonces locales et les
            numéros utiles.
          </p>
          <p>
            Le contenu vient de deux sources : <strong>automatique</strong>{" "}
            (météo, ferries, marées, soleil/lune sont récupérés en temps réel)
            et <strong>communautaire</strong> (vous publiez vos événements,
            annonces et services en 2 minutes, validés sous 24h par
            l&apos;équipe).
          </p>
        </div>

        <h2 className="mt-12 mb-6 font-display text-3xl text-ocean-950">
          Nos valeurs
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-ocean-100 p-5 hover:border-tiare-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lagon-500 to-ocean-700 text-white flex items-center justify-center mb-3">
                <Icon size={20} />
              </div>
              <h3 className="font-display text-lg text-ocean-900">{title}</h3>
              <p className="mt-1 text-sm text-ocean-600">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-to-br from-ocean-900 to-ocean-950 p-8 sm:p-10 text-white">
          <h2 className="font-display text-2xl sm:text-3xl">Envie d&apos;aider ?</h2>
          <p className="mt-3 text-ocean-200">
            Le projet est ouvert. Si vous voulez participer (modération,
            traduction tahitien/anglais, partenariats locaux, sponsor
            commerçant…), écrivez-nous.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-ocean-900 font-semibold hover:-translate-y-0.5 transition-transform"
            >
              Nous contacter
            </Link>
            <Link
              href="/soumettre"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur text-white border border-white/30 hover:bg-white/20 transition-colors"
            >
              Publier une info
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
