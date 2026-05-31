"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_DIRECTORY } from "@/lib/site-directory";

function linkActive(pathname: string, href: string): boolean {
  if (href.startsWith("/#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function categoryActive(pathname: string, categoryId: string): boolean {
  const cat = SITE_DIRECTORY.find((c) => c.id === categoryId);
  if (!cat) return false;
  return cat.links.some((l) => linkActive(pathname, l.href));
}

type Props = {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function MainNav({ variant, onNavigate }: Props) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) {
        setOpenId(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  if (variant === "desktop") {
    return (
      <div ref={navRef} className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-1">
        <Link
          href="/"
          className={cn(
            "px-2.5 lg:px-3 py-1.5 text-[13px] lg:text-sm font-medium rounded-full transition-colors whitespace-nowrap",
            pathname === "/"
              ? "bg-lagon-100 text-ocean-900 ring-1 ring-lagon-300"
              : "text-ocean-800 hover:bg-lagon-100",
          )}
        >
          Accueil
        </Link>

        {SITE_DIRECTORY.map((category) => {
          const active = categoryActive(pathname, category.id);
          const open = openId === category.id;
          return (
            <div key={category.id} className="relative">
              <button
                type="button"
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => setOpenId(open ? null : category.id)}
                onMouseEnter={() => setOpenId(category.id)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 lg:px-3 py-1.5 text-[13px] lg:text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                  active || open
                    ? "bg-lagon-100 text-ocean-900 ring-1 ring-lagon-300"
                    : "text-ocean-800 hover:bg-lagon-100",
                )}
              >
                {category.navLabel}
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", open && "rotate-180")}
                  aria-hidden
                />
              </button>
              {open && (
                <div
                  className="absolute left-0 top-full pt-1.5 min-w-[220px] z-[200]"
                  onMouseLeave={() => setOpenId(null)}
                >
                  <ul
                    role="menu"
                    className="rounded-xl border border-ocean-100 bg-white py-1.5 shadow-lg"
                  >
                    {category.links.map((link) => (
                      <li key={link.href} role="none">
                        <Link
                          href={link.href}
                          role="menuitem"
                          className={cn(
                            "block px-4 py-2.5 text-sm transition-colors",
                            linkActive(pathname, link.href)
                              ? "bg-lagon-50 text-ocean-900 font-semibold"
                              : "text-ocean-800 hover:bg-lagon-50",
                          )}
                        >
                          <span className="block">{link.label}</span>
                          <span className="block text-xs text-ocean-500 font-normal mt-0.5">
                            {link.description}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={navRef} className="flex flex-col gap-1">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "px-4 py-3 rounded-xl text-base font-medium transition-colors",
          pathname === "/"
            ? "bg-lagon-100 text-ocean-900"
            : "text-ocean-800 hover:bg-lagon-100",
        )}
      >
        Accueil
      </Link>

      {SITE_DIRECTORY.map((category) => {
        const open = openId === category.id;
        const active = categoryActive(pathname, category.id);
        return (
          <div key={category.id} className="rounded-xl border border-ocean-100 overflow-hidden">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : category.id)}
              className={cn(
                "flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold transition-colors",
                active || open
                  ? "bg-lagon-50 text-ocean-900"
                  : "bg-white text-ocean-800 hover:bg-lagon-50/80",
              )}
            >
              {category.navLabel}
              <ChevronDown
                size={18}
                className={cn("shrink-0 transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
            {open && (
              <ul className="border-t border-ocean-100 bg-white py-1">
                {category.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      className={cn(
                        "block px-4 py-2.5 text-sm transition-colors",
                        linkActive(pathname, link.href)
                          ? "bg-lagon-100 text-ocean-900 font-medium"
                          : "text-ocean-700 hover:bg-lagon-50",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
