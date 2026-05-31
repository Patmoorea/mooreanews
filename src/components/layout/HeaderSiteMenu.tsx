"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SITE_DIRECTORY } from "@/lib/site-directory";

type Props = {
  onNavigate?: () => void;
  variant: "mobile" | "desktop";
};

export function HeaderSiteMenu({ onNavigate, variant }: Props) {
  const pathname = usePathname();

  if (variant === "desktop") {
    return (
      <Link
        href="/#plan-du-site"
        className="px-2.5 lg:px-3 py-1.5 text-[13px] lg:text-sm font-medium rounded-full text-ocean-800 hover:bg-lagon-100 transition-colors whitespace-nowrap ring-1 ring-ocean-200/80"
      >
        Plan du site
      </Link>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-ocean-100 space-y-4">
      <p className="px-4 text-xs font-semibold uppercase tracking-wider text-ocean-500">
        Toutes les pages
      </p>
      {SITE_DIRECTORY.map((category) => (
        <div key={category.id}>
          <p className="px-4 text-sm font-semibold text-ocean-900">
            {category.title}
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {category.links.map((link) => {
              const active =
                link.href.startsWith("/#") === false &&
                (link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      "block px-4 py-2 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-lagon-100 text-ocean-900 font-medium"
                        : "text-ocean-700 hover:bg-lagon-50",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
