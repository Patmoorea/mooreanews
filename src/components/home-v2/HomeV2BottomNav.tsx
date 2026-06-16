"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CloudSun,
  Home,
  Menu,
  Newspaper,
} from "lucide-react";

const ITEMS = [
  { href: "/accueil-v2", label: "Accueil", icon: Home, match: "/accueil-v2" },
  { href: "/actualites", label: "Actus", icon: Newspaper, match: "/actualites" },
  { href: "/vigilance-cyclone", label: "Météo", icon: CloudSun, match: "/vigilance" },
  { href: "/alertes", label: "Alertes", icon: AlertTriangle, match: "/alertes" },
  { href: "/pratique", label: "Plus", icon: Menu, match: "/pratique" },
] as const;

export function HomeV2BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-ocean-200/80 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navigation principale"
    >
      <ul className="flex items-stretch justify-around max-w-lg mx-auto">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active =
            match === "/accueil-v2"
              ? pathname === "/accueil-v2"
              : pathname.startsWith(match);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                  active
                    ? "text-lagon-700"
                    : "text-ocean-500 hover:text-ocean-800"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? "text-lagon-600" : undefined}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
