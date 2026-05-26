"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Search } from "lucide-react";
import { NAV_ITEMS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
          : "bg-white/80 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-lagon-400 via-tipanier-400 to-soleil-400 flex items-center justify-center text-white font-display text-xl sm:text-2xl shadow-[var(--shadow-tropical)] group-hover:scale-110 transition-transform">
                M
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-lagon-400 to-soleil-400 blur-md opacity-40 group-hover:opacity-60 transition-opacity -z-10" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl sm:text-2xl text-ocean-900">
                {SITE.name}
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-lagon-600 font-medium">
                {SITE.tagline}
              </span>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3.5 py-2 text-sm font-medium text-ocean-800 rounded-full hover:bg-lagon-100 hover:text-ocean-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/soumettre"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-sm font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform"
            >
              + Publier
            </Link>
          </div>

          {/* Bouton mobile */}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg text-ocean-800 hover:bg-lagon-100 transition-colors"
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <div className="lg:hidden border-t border-ocean-100 bg-white/95 backdrop-blur">
          <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
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
