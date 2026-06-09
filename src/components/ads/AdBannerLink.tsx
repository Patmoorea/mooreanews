"use client";

import type { ReactNode } from "react";

type Props = {
  href: string;
  slotId: string;
  campaignId: string;
  className?: string;
  children: ReactNode;
};

export function AdBannerLink({
  href,
  slotId,
  campaignId,
  className,
  children,
}: Props) {
  function onClick() {
    fetch("/api/analytics/ad-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, campaignId, path: window.location.pathname }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
