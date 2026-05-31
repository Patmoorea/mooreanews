import Link from "next/link";
import {
  Newspaper,
  Calendar,
  Megaphone,
  CloudSun,
  Siren,
  Palmtree,
  LayoutGrid,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "#infos-locales",
    label: "Actualités",
    icon: Newspaper,
    primary: true,
  },
  { href: "#agenda", label: "Événements", icon: Calendar, primary: true },
  { href: "#annonces", label: "Annonces", icon: Megaphone, primary: true },
  { href: "/alertes", label: "Alertes", icon: Siren, primary: false },
  { href: "/visiteurs", label: "Visiteurs", icon: Palmtree, primary: true },
  {
    href: "#plan-du-site",
    label: "Tout le site",
    icon: LayoutGrid,
    primary: true,
  },
  {
    href: "#en-direct",
    label: "Météo & ferries",
    icon: CloudSun,
    primary: false,
  },
] as const;

/** Accès direct aux rubriques — l’info locale avant les widgets météo. */
export function HomeSectionNav() {
  return (
    <nav
      className="sticky top-14 md:top-[7.25rem] z-40 bg-white/95 backdrop-blur-md border-b border-ocean-100 shadow-sm"
      aria-label="Rubriques de l’accueil"
    >
      <Container className="py-2.5">
        <p className="sr-only">
          Aller directement aux actualités, à l’agenda ou aux annonces
        </p>
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-thin">
          {LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors shrink-0",
                  item.primary
                    ? "bg-ocean-900 text-white hover:bg-ocean-800 shadow-sm"
                    : "bg-lagon-50 text-ocean-800 border border-lagon-200 hover:bg-lagon-100",
                )}
              >
                <Icon size={16} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </Container>
    </nav>
  );
}
