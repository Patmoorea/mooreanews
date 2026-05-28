"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/layout/SearchBar";
import { UserMenu } from "@/components/layout/UserMenu";
import { Logo } from "@/components/ui/Logo";
import { BrandBanner } from "@/components/ui/BrandBanner";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur shadow-[var(--shadow-soft)] border-b border-ocean-100"
          : "bg-white/90 backdrop-blur-sm border-b border-ocean-100/60",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 lg:h-[4.25rem] items-center justify-between gap-3 lg:gap-4">
          {/* Marque : bannière recadrée (desktop/tablette) ou logo seul (mobile) */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 min-w-0"
            aria-label="MooreaNews — Accueil"
          >
            {/* Mobile : logo rond lisible */}
            <Logo
              size={40}
              priority
              className="h-9 w-9 sm:hidden flex-shrink-0 rounded-full shadow-sm group-hover:scale-105 transition-transform"
            />
            {/* sm+ : bannière adaptée au menu */}
            <BrandBanner
              variant="header"
              priority
              className="hidden sm:block group-hover:opacity-95 transition-opacity shadow-sm"
            />
          </Link>

          {/* Nav desktop */}
          <nav
            className="hidden lg:flex items-center gap-0.5 flex-1 justify-center min-w-0"
            aria-label="Navigation principale"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2.5 xl:px-3 py-2 text-[13px] xl:text-sm font-medium text-ocean-800 rounded-full hover:bg-lagon-100 hover:text-ocean-900 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <SearchBar />
            <UserMenu />
            <Link
              href="/soumettre"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-sm font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform whitespace-nowrap"
            >
              + Publier
            </Link>
          </div>

          {/* Bouton mobile */}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg text-ocean-800 hover:bg-lagon-100 transition-colors flex-shrink-0"
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <div className="lg:hidden border-t border-ocean-100 bg-white/98 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 flex justify-center">
            <BrandBanner variant="header" className="sm:hidden w-[min(100%,280px)] h-11" />
          </div>
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-medium text-ocean-800 hover:bg-lagon-100 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/soumettre"
              onClick={() => setIsOpen(false)}
              className="mt-2 px-4 py-3 rounded-xl bg-gradient-to-br from-tiare-400 to-tiare-500 text-white font-semibold text-center"
            >
              + Publier une info
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
