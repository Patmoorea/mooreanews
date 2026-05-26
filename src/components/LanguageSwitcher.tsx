"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES, LOCALE_LABELS, LOCALE_FLAGS } from "@/lib/constants";
import { ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale() as (typeof LOCALES)[number];
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Changer de langue"
      >
        <span>{LOCALE_FLAGS[locale]}</span>
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[150px] rounded-lg bg-white shadow-xl border border-lagoon-100 overflow-hidden text-deep-900">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => {
                router.replace(pathname, { locale: l });
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-lagoon-50 transition-colors flex items-center gap-2 ${
                l === locale ? "bg-lagoon-50 font-semibold" : ""
              }`}
            >
              <span>{LOCALE_FLAGS[l]}</span>
              <span>{LOCALE_LABELS[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
