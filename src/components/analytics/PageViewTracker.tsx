"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { deviceTypeFromUserAgent } from "@/lib/page-analytics";

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

/** Enregistre une page vue (hors admin / api). */
export function PageViewTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (last.current === pathname) return;
    last.current = pathname;

    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
        visitorId: getVisitorId(),
        deviceType: deviceTypeFromUserAgent(navigator.userAgent ?? ""),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
