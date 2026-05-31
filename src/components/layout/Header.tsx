"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/layout/SearchBar";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { HeaderSiteMenu } from "@/components/layout/HeaderSiteMenu";
import { Logo } from "@/components/ui/Logo";

function isNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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
      {/* Ligne logo + actions (sans bannière image) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
            aria-label="MooreaNews — Accueil"
          >
            <Logo
              size={40}
              priority
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-sm group-hover:scale-105 transition-transform ring-2 ring-lagon-200"
            />
            <span className="font-display text-lg sm:text-xl text-ocean-900">
              Moorea<span className="text-lagon-600">News</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 relative z-[100]">
              <ThemeToggle />
              <SearchBar />
              <UserMenu />
            </div>
            <Link
              href="/soumettre"
              className="hidden sm:inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-xs sm:text-sm font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform whitespace-nowrap"
            >
              + Publier
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-ocean-800 hover:bg-lagon-100"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu complet — 2e ligne (tablette + desktop) */}
      <nav
        className="hidden md:block border-t border-ocean-100/80"
        aria-label="Navigation principale"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-x-0.5 gap-y-1 py-2.5">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2.5 lg:px-3 py-1.5 text-[13px] lg:text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                  active
                    ? "bg-lagon-100 text-ocean-900 ring-1 ring-lagon-300"
                    : "text-ocean-800 hover:bg-lagon-100 hover:text-ocean-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/telecharger"
            className="px-2.5 lg:px-3 py-1.5 text-[13px] lg:text-sm font-medium rounded-full text-lagon-700 hover:bg-lagon-100 transition-colors whitespace-nowrap"
          >
            App
          </Link>
          <Link
            href="/en"
            className="px-2.5 lg:px-3 py-1.5 text-[13px] lg:text-sm font-medium rounded-full text-ocean-600 hover:bg-lagon-100 transition-colors whitespace-nowrap"
          >
            EN
          </Link>
          <HeaderSiteMenu variant="desktop" />
        </div>
      </nav>

      {isOpen && (
        <div className="md:hidden relative z-[100] border-t border-ocean-100 bg-white shadow-lg">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-base font-medium transition-colors",
                  isNavActive(pathname, item.href)
                    ? "bg-lagon-100 text-ocean-900"
                    : "text-ocean-800 hover:bg-lagon-100",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/telecharger"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 rounded-xl text-base font-medium text-lagon-700 hover:bg-lagon-100"
            >
              Télécharger l&apos;app
            </Link>
            <Link
              href="/en"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 rounded-xl text-base font-medium text-ocean-600 hover:bg-lagon-100"
            >
              English
            </Link>
            <HeaderSiteMenu variant="mobile" onNavigate={() => setIsOpen(false)} />
            <div className="mt-2 pt-2 border-t border-ocean-100 flex flex-col gap-2">
              <ThemeToggle />
              <SearchBar variant="inline" />
              <UserMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
