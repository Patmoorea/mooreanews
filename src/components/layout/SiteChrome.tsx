"use client";

import { usePathname } from "next/navigation";
import type { AdSponsorStripItem } from "@/lib/ads-sponsors";
import type { ActiveSeasonalTheme } from "@/lib/seasonal-theme";
import { SITE } from "@/lib/constants";
import { InfoBannerSlot } from "@/components/layout/InfoBannerSlot";
import { BreakingNewsSlot } from "@/components/layout/BreakingNewsSlot";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeasonalStrip } from "@/components/decor/SeasonalStrip";
import { Ticker } from "@/components/widgets/Ticker";
import { ServiceHighlightsTicker } from "@/components/widgets/ServiceHighlightsTicker";
import { FerryStickyBar } from "@/components/widgets/FerryStickyBar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

function isMinimalChrome(pathname: string): boolean {
  return pathname.startsWith("/app") || pathname.startsWith("/admin");
}

export function SiteChrome({
  children,
  sponsorItems = [],
  seasonalTheme = null,
}: {
  children: React.ReactNode;
  sponsorItems?: AdSponsorStripItem[];
  seasonalTheme?: ActiveSeasonalTheme | null;
}) {
  const pathname = usePathname();
  const minimal = isMinimalChrome(pathname);
  const logoSrc = seasonalTheme?.assets.logo ?? SITE.logo;

  if (minimal) {
    return (
      <>
        <ServiceWorkerRegister />
        <PageViewTracker />
        <main className="flex-1">{children}</main>
      </>
    );
  }

  return (
    <div
      data-season={seasonalTheme?.id}
      style={seasonalTheme?.cssVars as React.CSSProperties | undefined}
      className="contents"
    >
      <ServiceWorkerRegister />
      <PageViewTracker />
      <InfoBannerSlot />
      <BreakingNewsSlot />
      <Header logoSrc={logoSrc} />
      {seasonalTheme ? <SeasonalStrip theme={seasonalTheme} /> : null}
      <ServiceHighlightsTicker />
      <Ticker />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <FerryStickyBar />
      <InstallPrompt />
      <Footer sponsorItems={sponsorItems} />
    </div>
  );
}
