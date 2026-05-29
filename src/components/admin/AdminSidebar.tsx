"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Calendar,
  Megaphone,
  Siren,
  UtensilsCrossed,
  Mountain,
  Phone,
  Inbox,
  Mail,
  Rss,
  BarChart3,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/admin/alerts", label: "Alertes", icon: Siren },
  { href: "/admin/articles", label: "Articles", icon: Newspaper },
  { href: "/admin/events", label: "Événements", icon: Calendar },
  { href: "/admin/announcements", label: "Annonces", icon: Megaphone },
  { href: "/admin/restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { href: "/admin/activities", label: "Activités", icon: Mountain },
  { href: "/admin/info", label: "Infos pratiques", icon: Phone },
  { href: "/admin/submissions", label: "Soumissions", icon: Inbox },
  { href: "/admin/external", label: "Veille RSS", icon: Rss },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-full lg:w-64 lg:flex-shrink-0">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-ocean-600 hover:text-tiare-600 mb-4"
      >
        <ArrowLeft size={14} />
        Retour au site
      </Link>
      <nav className="bg-white rounded-2xl border border-ocean-100 p-2 sticky top-24">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-gradient-to-r from-lagon-500 to-ocean-600 text-white shadow-md"
                  : "text-ocean-700 hover:bg-lagon-50"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
