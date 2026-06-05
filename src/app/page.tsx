import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { SafetyCampaignSlot } from "@/components/home/SafetyCampaignSlot";
import { PushAlertBanner } from "@/components/pwa/PushAlertBanner";
import { MooreaDuJour } from "@/components/home/MooreaDuJour";
import { HomeSectionNav } from "@/components/home/HomeSectionNav";
import { LiveDashboard } from "@/components/home/LiveDashboard";
import { FeaturedArticles } from "@/components/home/FeaturedArticles";
import { ExternalArticles } from "@/components/ExternalArticles";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { WeekendAgenda } from "@/components/home/WeekendAgenda";
import { RecentAnnouncements } from "@/components/home/RecentAnnouncements";
import { InteractiveMap } from "@/components/home/InteractiveMap";
import { CommunityCTA } from "@/components/home/CommunityCTA";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <SafetyCampaignSlot />
      <PushAlertBanner />
      <MooreaDuJour />
      <HomeSectionNav />
      <LiveDashboard />
      <WeekendAgenda />
      <FeaturedArticles />
      <UpcomingEvents />
      <RecentAnnouncements />
      <ExternalArticles limit={6} />
      <InteractiveMap />
      <CommunityCTA />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE.name,
            url: SITE.url,
            description: SITE.description,
            inLanguage: "fr-PF",
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE.url}/recherche?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  );
}
