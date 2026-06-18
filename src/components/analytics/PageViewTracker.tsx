"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { deviceTypeFromUserAgent } from "@/lib/page-analytics";
import { parseUtmFromSearch } from "@/lib/utm";

const VISITOR_KEY = "mn_visitor_id";

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

/** Enregistre une page vue (hors admin / api), avec attribution UTM si présente. */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const key = `${pathname}?${searchParams?.toString() ?? ""}`;
    if (last.current === key) return;
    last.current = key;

    const utm = parseUtmFromSearch(searchParams?.toString() ?? "");

    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
        visitorId: getVisitorId(),
        deviceType: deviceTypeFromUserAgent(navigator.userAgent ?? ""),
        utm: utm ?? undefined,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
