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
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bannerNav = !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-shadow duration-300",
        scrolled && "bg-white/95 backdrop-blur shadow-[var(--shadow-soft)] border-b border-lagon-200/80",
      )}
    >
      {/* Barre logo + actions */}
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          bannerNav && "relative z-20 bg-ocean-950/45 backdrop-blur-sm",
        )}
      >
        <div className="flex h-12 sm:h-14 items-center justify-between gap-3">
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
                bannerNav ? "ring-white/40" : "ring-lagon-200",
              )}
            />
            <span
              className={cn(
                "hidden sm:inline font-display text-lg tracking-tight",
                bannerNav ? "text-white drop-shadow-md" : "text-ocean-900",
              )}
            >
              Moorea<span className={bannerNav ? "text-lagon-300" : "text-lagon-600"}>News</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 [&_button]:text-ocean-800">
            {bannerNav && (
              <div className="[&_button]:!text-white [&_button:hover]:!bg-white/15 [&_svg]:drop-shadow-sm">
                <SearchBar />
                <UserMenu />
              </div>
            )}
            {!bannerNav && (
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
              bannerNav
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

      {/* Menu pleine largeur sur la bannière */}
      <div
        className={cn(
          "relative w-full overflow-hidden",
          bannerNav ? "h-[4.25rem] sm:h-[4.75rem] lg:h-[5.25rem]" : "hidden lg:block border-t border-lagon-100/80 bg-white/95",
        )}
      >
        {bannerNav && (
          <>
            <Image
              src={SITE.navBanner}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_62%] sm:object-[center_58%] lg:object-[center_55%]"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-ocean-950/90 via-ocean-950/40 to-transparent"
              aria-hidden
            />
          </>
        )}

        <nav
          className={cn(
            "relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 flex items-center justify-center",
            bannerNav ? "h-full" : "h-11",
          )}
          aria-label="Navigation principale"
        >
          <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 max-w-full">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-2 sm:px-2.5 xl:px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px] xl:text-sm font-semibold rounded-full transition-colors whitespace-nowrap",
                    bannerNav
                      ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] hover:bg-white/20"
                      : "text-ocean-800 font-medium hover:bg-lagon-100 hover:text-ocean-900",
                    active &&
                      (bannerNav
                        ? "bg-white/25 ring-1 ring-white/50"
                        : "bg-lagon-100 text-ocean-900"),
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <div
          className={cn(
            "lg:hidden border-t",
            bannerNav
              ? "border-white/20 bg-ocean-950/95 backdrop-blur-md"
              : "border-ocean-100 bg-white/98 backdrop-blur",
          )}
        >
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-base font-medium transition-colors",
                  bannerNav
                    ? "text-white hover:bg-white/10"
                    : "text-ocean-800 hover:bg-lagon-100",
                )}
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
