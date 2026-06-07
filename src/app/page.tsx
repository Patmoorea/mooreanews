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

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/actualites/feed.xml" },
  },
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
    </>
  );
}
