"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X, MapPin } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/evenements", label: t("events") },
    { href: "/annonces", label: t("announcements") },
    { href: "/restaurants", label: t("restaurants") },
    { href: "/activites", label: t("activities") },
    { href: "/infos", label: t("info") },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "glass-card shadow-lg"
          : "bg-gradient-to-b from-white/80 to-white/30 backdrop-blur-sm"
      )}
    >
      {/* Top bar */}
      <div className="bg-gradient-to-r from-lagoon-800 via-lagoon-700 to-deep-800 text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>Moorea · Polynésie française</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Nav principale */}
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          aria-label="Moorea Hub - Accueil"
        >
          <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-lagoon-400 via-lagoon-600 to-deep-700 flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all">
            <span className="text-white font-display text-xl">M</span>
            <span className="absolute -top-1 -right-1 text-base">🌺</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl text-lagoon-900">
              Moorea Hub
            </span>
            <span className="text-[10px] uppercase tracking-widest text-hibiscus-600 font-medium">
              L'île sœur · en live
            </span>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-lagoon-100 text-lagoon-800"
                    : "text-deep-900 hover:bg-lagoon-50 hover:text-lagoon-700"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/publier"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-hibiscus-500 to-sunset-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-xl hover:scale-105 transition-all"
          >
            <span className="text-base">+</span>
            {t("submit")}
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-lg text-deep-900 hover:bg-lagoon-50 transition-colors"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <div className="lg:hidden border-t border-lagoon-100 bg-white">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-lagoon-100 text-lagoon-800"
                      : "text-deep-900 hover:bg-lagoon-50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/publier"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-hibiscus-500 to-sunset-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md"
            >
              <span className="text-base">+</span>
              {t("submit")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
