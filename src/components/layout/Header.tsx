"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/layout/SearchBar";
import { UserMenu } from "@/components/layout/UserMenu";
import { Logo } from "@/components/ui/Logo";
import { BrandBanner } from "@/components/ui/BrandBanner";

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
        "transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur shadow-[var(--shadow-soft)] border-b border-ocean-100"
          : "bg-white/90 backdrop-blur-sm border-b border-ocean-100/60",
      )}
    >
      {/* ——— Mobile ——— */}
      <div className="md:hidden mx-auto max-w-7xl px-4 flex h-14 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="MooreaNews — Accueil"
        >
          <Logo size={40} priority className="h-9 w-9 rounded-full shadow-sm" />
          <span className="font-display text-lg text-ocean-900">
            Moorea<span className="text-lagon-600">News</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/soumettre"
            className="px-3 py-1.5 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-xs font-semibold whitespace-nowrap"
          >
            + Publier
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="p-2 rounded-lg text-ocean-800 hover:bg-lagon-100"
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* ——— md+ : fond tropical pleine largeur (emplacement) + logo BrandBanner inchangé ——— */}
      <div className="hidden md:block">
        <div className="relative w-screen left-1/2 -translate-x-1/2 h-11 lg:h-12 xl:h-[52px] overflow-hidden bg-ocean-900">
          <Image
            src={SITE.navBanner}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_28%] pointer-events-none select-none"
            aria-hidden
            priority
          />
          <div className="absolute inset-0 bg-white/55 pointer-events-none" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <Link href="/" className="flex-shrink-0" aria-label="MooreaNews — Accueil">
              <BrandBanner
                variant="header"
                priority
                className="group-hover:opacity-95 transition-opacity shadow-sm"
              />
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-b border-ocean-100/70">
          <div className="flex flex-wrap items-center justify-between gap-y-2 py-2.5">
            <nav
              className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-1 flex-1 min-w-0"
              aria-label="Navigation principale"
            >
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
            </nav>
            <div className="flex items-center gap-2 flex-shrink-0 relative z-[100]">
              <SearchBar />
              <UserMenu />
              <Link
                href="/soumettre"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-sm font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform whitespace-nowrap"
              >
                + Publier
              </Link>
            </div>
          </div>
        </div>
      </div>

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
            <div className="mt-2 pt-2 border-t border-ocean-100 flex flex-col gap-2">
              <SearchBar variant="inline" />
              <UserMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
