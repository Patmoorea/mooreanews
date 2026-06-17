"use client";

import { usePathname } from "next/navigation";
import type { AdSponsorStripItem } from "@/lib/ads-sponsors";
import { InfoBannerSlot } from "@/components/layout/InfoBannerSlot";
import { BreakingNewsSlot } from "@/components/layout/BreakingNewsSlot";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Ticker } from "@/components/widgets/Ticker";
import { ServiceHighlightsTicker } from "@/components/widgets/ServiceHighlightsTicker";
import { FerryStickyBar } from "@/components/widgets/FerryStickyBar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import type { SeasonThemeId } from "@/lib/seasonal-theme-meta";

function isMinimalChrome(pathname: string): boolean {
  return pathname.startsWith("/app") || pathname.startsWith("/admin");
}

export function SiteChrome({
  children,
  sponsorItems = [],
  seasonTheme = null,
  seasonRibbon = null,
}: {
  children: React.ReactNode;
  sponsorItems?: AdSponsorStripItem[];
  seasonTheme?: SeasonThemeId | null;
  seasonRibbon?: React.ReactNode;
}) {
  const pathname = usePathname();
  const minimal = isMinimalChrome(pathname);

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
    <>
      <ServiceWorkerRegister />
      <PageViewTracker />
      <InfoBannerSlot />
      <BreakingNewsSlot />
      <Header seasonTheme={seasonTheme} />
      {seasonRibbon}
      <ServiceHighlightsTicker />
      <Ticker />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <FerryStickyBar />
      <InstallPrompt />
      <Footer sponsorItems={sponsorItems} />
    </>
  );
}
