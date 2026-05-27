"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/layout/SearchBar";
import { UserMenu } from "@/components/layout/UserMenu";
import { Logo } from "@/components/ui/Logo";
import { BrandBanner } from "@/components/ui/BrandBanner";

function navLabel(label: string) {
  if (label === "Infos pratiques") {
    return (
      <>
        <span className="2xl:hidden">Infos</span>
        <span className="hidden 2xl:inline">Infos pratiques</span>
      </>
    );
  }
  return label;
}

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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 lg:h-[4.25rem] items-center gap-2 sm:gap-3 min-w-0">
          {/* Bannière — ne recouvre pas le menu (z-0, largeur réduite) */}
          <Link
            href="/"
            className="relative z-0 flex items-center gap-2 sm:gap-3 group flex-shrink-0"
            aria-label="MooreaNews — Accueil"
          >
            <Logo
              size={40}
              priority
              className="h-9 w-9 sm:hidden flex-shrink-0 rounded-full shadow-sm group-hover:scale-105 transition-transform"
            />
            <BrandBanner
              variant="header"
              priority
              className="hidden sm:block group-hover:opacity-95 transition-opacity shadow-sm"
            />
          </Link>

          {/* Menu — visible dès md, défilement horizontal si besoin */}
          <nav
            className={cn(
              "relative z-20 hidden md:flex flex-1 min-w-0 items-center justify-center gap-0.5",
              "overflow-x-auto overscroll-x-contain px-1",
              "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            )}
            aria-label="Navigation principale"
          >
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex-shrink-0 px-2 lg:px-2.5 xl:px-3 py-2 text-[12px] lg:text-[13px] xl:text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                    active
                      ? "bg-lagon-100 text-ocean-900 ring-1 ring-lagon-300"
                      : "text-ocean-800 hover:bg-lagon-100 hover:text-ocean-900",
                  )}
                >
                  {navLabel(item.label)}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="relative z-20 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto md:ml-0">
            <div className="hidden lg:flex items-center gap-2">
              <SearchBar />
              <UserMenu />
            </div>
            <Link
              href="/soumettre"
              className="hidden sm:inline-flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-xs lg:text-sm font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform whitespace-nowrap"
            >
              + Publier
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-ocean-800 hover:bg-lagon-100 transition-colors flex-shrink-0"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile + tablette étroite */}
      {isOpen && (
        <div className="md:hidden relative z-50 border-t border-ocean-100 bg-white shadow-lg">
          <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 flex justify-center">
            <BrandBanner variant="header" className="sm:hidden w-[min(100%,280px)] h-11" />
          </div>
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
            <div className="mt-2 pt-2 border-t border-ocean-100 flex flex-col gap-2">
              <SearchBar variant="inline" />
              <UserMenu />
              <Link
                href="/soumettre"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl bg-gradient-to-br from-tiare-400 to-tiare-500 text-white font-semibold text-center"
              >
                + Publier une info
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
