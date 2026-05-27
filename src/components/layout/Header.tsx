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

function isNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onTop = !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-shadow duration-300",
        scrolled && "shadow-[var(--shadow-soft)]",
      )}
    >
      {/* Barre logo + actions (au-dessus de la bannière menu) */}
      <div
        className={cn(
          "relative z-20 transition-colors duration-300",
          onTop
            ? "bg-ocean-950/40 backdrop-blur-[2px]"
            : "bg-white/95 backdrop-blur border-b border-lagon-200/80",
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-12 sm:h-14 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group flex-shrink-0"
            aria-label="MooreaNews — Accueil"
          >
            <Logo
              size={40}
              priority
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-md group-hover:scale-105 transition-transform ring-2",
                onTop ? "ring-white/50" : "ring-lagon-200",
              )}
            />
            <span
              className={cn(
                "hidden sm:inline font-display text-lg tracking-tight",
                onTop ? "text-white drop-shadow-md" : "text-ocean-900",
              )}
            >
              Moorea<span className={onTop ? "text-lagon-300" : "text-lagon-600"}>News</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {onTop ? (
              <div className="[&_button]:!text-white [&_button:hover]:!bg-white/15 [&_svg]:drop-shadow-sm">
                <SearchBar />
                <UserMenu />
              </div>
            ) : (
              <>
                <SearchBar />
                <UserMenu />
              </>
            )}
            <Link
              href="/soumettre"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-sm font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform whitespace-nowrap"
            >
              + Publier
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors flex-shrink-0",
              onTop
                ? "text-white hover:bg-white/15"
                : "text-ocean-800 hover:bg-lagon-100",
            )}
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/*
        Bannière 1024×409 : hauteur fixe + object-contain (image entière visible).
        Ne pas utiliser width/height en mode « flux » : Next.js réserve ~40 % de la largeur
        et rogne malgré max-h.
      */}
      <div
        className="relative w-full h-[3.25rem] sm:h-14 md:h-[3.75rem] bg-ocean-950"
        aria-label="Navigation avec bannière MooreaNews"
      >
        <Image
          src={SITE.navBanner}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-contain object-center select-none pointer-events-none"
          aria-hidden
        />
        {/* Voile bas uniquement — ne masque pas « MOOREA NEWS » en haut */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ocean-950/55 to-transparent pointer-events-none"
          aria-hidden
        />

        <nav
          className="absolute inset-0 z-10 w-full px-1.5 sm:px-4 md:px-6 flex items-center justify-center"
          aria-label="Navigation principale"
        >
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 w-full max-w-7xl">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-1.5 sm:px-2.5 md:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs md:text-sm font-bold rounded-full transition-all whitespace-nowrap",
                    "text-white shadow-[0_1px_4px_rgba(0,0,0,0.45)]",
                    "hover:bg-white/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
                    active
                      ? "bg-white/30 ring-2 ring-white/60 backdrop-blur-sm"
                      : "bg-black/15 backdrop-blur-[2px]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Menu mobile (s’ouvre sous la bannière) */}
      {isOpen && (
        <div className="lg:hidden border-t border-white/20 bg-ocean-950/95 backdrop-blur-md">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-semibold text-white hover:bg-white/15 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <SearchBar variant="inline" />
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
