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

/** Même hauteur que l’ancien logo/bannière menu (BrandBanner), pas plus haut */
const BANNER_H = "h-11 lg:h-12 xl:h-[52px]";

/** Pleine largeur écran (évite les marges blanches sur les côtés) */
const BANNER_FULL_BLEED =
  "relative w-screen max-w-[100vw] left-1/2 -translate-x-1/2";

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
        "transition-shadow duration-300",
        scrolled && "shadow-[var(--shadow-soft)]",
      )}
    >
      {/* ——— Mobile ——— */}
      <div className="md:hidden">
        <div
          className={cn(BANNER_FULL_BLEED, "overflow-hidden bg-ocean-900", BANNER_H)}
        >
          <Link href="/" className="block w-full h-full" aria-label="MooreaNews — Accueil">
            <Image
              src={SITE.navBanner}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_30%]"
            />
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-4 flex h-12 items-center justify-between gap-3 bg-white/95 border-b border-ocean-100">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo size={36} className="h-8 w-8 rounded-full" />
            <span className="font-display text-base text-ocean-900">
              Moorea<span className="text-lagon-600">News</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/soumettre"
              className="px-3 py-1.5 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-xs font-semibold"
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
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* ——— Tablette / desktop : bannière 100 % largeur (même hauteur), puis menu ——— */}
      <div className="hidden md:block">
        <div
          className={cn(BANNER_FULL_BLEED, "overflow-hidden bg-ocean-900", BANNER_H)}
        >
          <Image
            src={SITE.navBanner}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_28%] select-none pointer-events-none"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/30 via-transparent to-ocean-950/40 pointer-events-none" />

          <div className="absolute inset-y-0 right-0 flex items-center px-3 sm:px-5 lg:px-6">
            <div className="flex items-center gap-1.5 rounded-full bg-white/92 backdrop-blur-sm px-1.5 py-0.5 shadow-md border border-white/60 [&_button]:!py-1">
              <SearchBar />
              <UserMenu />
              <Link
                href="/soumettre"
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-xs font-semibold whitespace-nowrap"
              >
                + Publier
              </Link>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "border-b border-ocean-100",
            scrolled ? "bg-white/95 backdrop-blur" : "bg-white/90 backdrop-blur-sm",
          )}
        >
          <nav
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-x-0.5 gap-y-1 py-2.5"
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
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden relative z-50 border-t border-ocean-100 bg-white shadow-lg">
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
