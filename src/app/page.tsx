import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { AlertsStrip } from "@/components/home/AlertsStrip";
import { SafetyCampaignSlot } from "@/components/home/SafetyCampaignSlot";
import { HealthOnCallSlot } from "@/components/health/HealthOnCallSlot";
import { PushAlertBanner } from "@/components/pwa/PushAlertBanner";
import { MooreaDuJour } from "@/components/home/MooreaDuJour";
import { HomeSectionNav } from "@/components/home/HomeSectionNav";
import { LiveDashboard } from "@/components/home/LiveDashboard";
import { FeaturedArticles } from "@/components/home/FeaturedArticles";
import { AdSlot } from "@/components/ads/AdSlot";
import { ExternalArticles } from "@/components/ExternalArticles";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { WeekendAgenda } from "@/components/home/WeekendAgenda";
import { RecentAnnouncements } from "@/components/home/RecentAnnouncements";
import { InteractiveMap } from "@/components/home/InteractiveMap";
import { TelegramCommunityPromo } from "@/components/telegram/TelegramCommunityPromo";
import { CommunityCTA } from "@/components/home/CommunityCTA";

export const revalidate = 600;

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
      <AlertsStrip />
      <TelegramCommunityPromo variant="hero" />
      <AdSlot slotId="home-leaderboard" fullBleed />
      <SafetyCampaignSlot />
      <HealthOnCallSlot />
      <PushAlertBanner />
      <MooreaDuJour />
      <HomeSectionNav />
      <LiveDashboard />
      <WeekendAgenda />
      <FeaturedArticles />
      <AdSlot slotId="home-articles" fullBleed />
      <UpcomingEvents />
      <AdSlot slotId="home-events" />
      <RecentAnnouncements />
      <ExternalArticles limit={6} />
      <AdSlot slotId="home-map" fullBleed />
      <InteractiveMap />
      <CommunityCTA />
    </>
  );
}
