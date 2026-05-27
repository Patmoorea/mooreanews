import Link from "next/link";
import {
  Newspaper,
  Calendar,
  Tag,
  Utensils,
  Compass,
  Info,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { WaveDivider } from "@/components/decor/TropicalDecor";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import type { CategorySlug } from "@/lib/constants";

const CATS = [
  {
    href: "/actualites",
    label: "Actualités",
    description: "Tout ce qui bouge sur l'île",
    icon: Newspaper,
    category: "actualites" as CategorySlug,
    color: "from-lagon-500 to-ocean-700",
  },
  {
    href: "/evenements",
    label: "Événements",
    description: "Concerts, marchés, fêtes",
    icon: Calendar,
    category: "evenements" as CategorySlug,
    color: "from-tiare-400 to-tiare-600",
  },
  {
    href: "/annonces",
    label: "Annonces",
    description: "Vendre, acheter, louer, services",
    icon: Tag,
    category: "annonces" as CategorySlug,
    color: "from-soleil-400 to-couchant",
  },
  {
    href: "/restaurants",
    label: "Restaurants",
    description: "Où manger sur l'île",
    icon: Utensils,
    category: "restaurants" as CategorySlug,
    color: "from-orange-400 to-tiare-500",
  },
  {
    href: "/activites",
    label: "Activités",
    description: "Plongée, rando, lagon",
    icon: Compass,
    category: "activites" as CategorySlug,
    color: "from-tipanier-400 to-tipanier-700",
  },
  {
    href: "/infos-pratiques",
    label: "Infos pratiques",
    description: "Mairie, hôpital, urgences, transports",
    icon: Info,
    category: "infos-pratiques" as CategorySlug,
    color: "from-ocean-500 to-ocean-900",
  },
] satisfies {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: CategorySlug;
  color: string;
}[];

export function CategoriesGrid() {
  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-b from-white via-sable-50/80 to-lagon-50/50">
      <WaveDivider className="text-white absolute top-0 rotate-180 -mt-px" />
      <Container className="relative">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tiare-100 text-tiare-700 text-xs font-semibold uppercase tracking-widest border border-tiare-200/60">
            <span aria-hidden>🌴</span>
            Explorer l&apos;île
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl text-ocean-950">
            Tout Moorea, organisé pour vous
          </h2>
          <p className="mt-2 text-ocean-600 text-sm">
            De Maharepa à Afareaitu — votre guide local 🏝️
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-3">
          {CATS.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className="card-island group overflow-hidden hover:-translate-y-1 hover:shadow-[var(--shadow-tropical)] transition-all"
              >
                <ContentCoverImage
                  alt=""
                  category={cat.category}
                  className="aspect-[16/10]"
                  sizes="(max-width: 640px) 50vw, 33vw"
                  overlay
                >
                  <div
                    className={`absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-lg`}
                  >
                    <Icon size={20} />
                  </div>
                </ContentCoverImage>
                <div className="p-4 sm:p-5">
                  <h3 className="font-display text-lg sm:text-xl text-ocean-900 group-hover:text-tiare-600 transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-sm text-ocean-600 mt-1">{cat.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
