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

const CATS = [
  {
    href: "/actualites",
    label: "Actualités",
    description: "Tout ce qui bouge sur l'île",
    icon: Newspaper,
    color: "from-lagon-500 to-ocean-700",
  },
  {
    href: "/evenements",
    label: "Événements",
    description: "Concerts, marchés, fêtes",
    icon: Calendar,
    color: "from-tiare-400 to-tiare-600",
  },
  {
    href: "/annonces",
    label: "Annonces",
    description: "Vendre, acheter, louer, services",
    icon: Tag,
    color: "from-soleil-400 to-couchant",
  },
  {
    href: "/restaurants",
    label: "Restaurants",
    description: "Où manger sur l'île",
    icon: Utensils,
    color: "from-orange-400 to-tiare-500",
  },
  {
    href: "/activites",
    label: "Activités",
    description: "Plongée, rando, lagon",
    icon: Compass,
    color: "from-tipanier-400 to-tipanier-700",
  },
  {
    href: "/infos-pratiques",
    label: "Infos pratiques",
    description: "Mairie, hôpital, urgences",
    icon: Info,
    color: "from-ocean-500 to-ocean-900",
  },
] satisfies {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}[];

export function CategoriesGrid() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-ocean-50">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-tiare-100 text-tiare-700 text-xs font-semibold uppercase tracking-widest">
            Explorer
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl text-ocean-950">
            Tout Moorea, organisé pour vous
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-3">
          {CATS.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 border border-ocean-100 shadow-[var(--shadow-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-tropical)] transition-all"
              >
                <div
                  className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${cat.color} opacity-10 group-hover:opacity-20 transition-opacity`}
                />
                <div
                  className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-lg`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="relative mt-4 font-display text-xl text-ocean-900">
                  {cat.label}
                </h3>
                <p className="relative text-sm text-ocean-600 mt-1">
                  {cat.description}
                </p>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
