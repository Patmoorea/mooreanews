"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_DIRECTORY } from "@/lib/site-directory";

/** Plan du site accueil — une catégorie ouverte à la fois. */
export function SiteDirectoryAccordion() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-2">
      {SITE_DIRECTORY.map((category) => {
        const open = openId === category.id;
        return (
          <div
            key={category.id}
            className="rounded-2xl border border-ocean-100 bg-white shadow-sm overflow-hidden"
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : category.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors",
                open
                  ? "bg-gradient-to-r from-ocean-50 to-lagon-50/80"
                  : "hover:bg-ocean-50/50",
              )}
            >
              <span>
                <span className="font-display text-lg text-ocean-950 block">
                  {category.title}
                </span>
                <span className="text-xs text-ocean-600 mt-0.5 block">
                  {category.description} · {category.links.length} pages
                </span>
              </span>
              <ChevronDown
                size={20}
                className={cn(
                  "shrink-0 text-ocean-500 transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {open && (
              <ul className="divide-y divide-ocean-50 border-t border-ocean-100">
                {category.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-lagon-50/80 transition-colors"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-ocean-900 group-hover:text-tiare-700">
                          {link.label}
                        </span>
                        <span className="block text-xs text-ocean-500 mt-0.5">
                          {link.description}
                        </span>
                      </span>
                      <ArrowRight
                        size={16}
                        className="shrink-0 mt-0.5 text-ocean-300 group-hover:text-tiare-500 group-hover:translate-x-0.5 transition-all"
                        aria-hidden
                      />
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
