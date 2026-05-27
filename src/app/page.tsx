import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { LiveDashboard } from "@/components/home/LiveDashboard";
import { CategoriesGrid } from "@/components/home/CategoriesGrid";
import { FeaturedArticles } from "@/components/home/FeaturedArticles";
import { ExternalArticles } from "@/components/ExternalArticles";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { InteractiveMap } from "@/components/home/InteractiveMap";
import { CommunityCTA } from "@/components/home/CommunityCTA";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <LiveDashboard />
      <FeaturedArticles />
      <ExternalArticles limit={6} />
      <UpcomingEvents />
      <InteractiveMap />
      <CategoriesGrid />
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
