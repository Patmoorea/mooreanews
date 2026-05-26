import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/Hero";
import { LiveWidgets } from "@/components/LiveWidgets";
import { FeaturedNews } from "@/components/FeaturedNews";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SubmitCallout } from "@/components/SubmitCallout";
import { NewsletterForm } from "@/components/NewsletterForm";
import { getFeaturedArticles, getEvents } from "@/lib/content";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const articles = getFeaturedArticles();
  const events = getEvents();

  return (
    <div className="tropical-bg">
      <Hero />
      <LiveWidgets />
      <CategoryGrid />
      <FeaturedNews articles={articles} />
      <UpcomingEvents events={events} />
      <SubmitCallout />
      <NewsletterForm />
    </div>
  );
}
