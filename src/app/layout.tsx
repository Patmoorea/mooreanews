import type { Metadata, Viewport } from "next";
import { Inter, Marcellus } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/lib/constants";
import {
  getSiteOrigin,
  googleSiteVerification,
  bingSiteVerification,
  webSiteJsonLd,
} from "@/lib/seo";
import { getFooterSponsorStripItems } from "@/lib/ads";
import {
  getActiveSeasonTheme,
} from "@/lib/seasonal-theme";
import { seasonThemeColor } from "@/lib/seasonal-theme-meta";
import { SeasonalDecor } from "@/components/decor/SeasonalDecor";
import { SeasonalThemeRibbon } from "@/components/layout/SeasonalThemeRibbon";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "Moorea",
    "Moorea actualités",
    "Moorea news",
    "Tahiti",
    "Polynésie française",
    "actualités Moorea",
    "événements Moorea",
    "annonces Moorea",
    "restaurants Moorea",
    "hébergements Moorea",
    "ferries Tahiti Moorea",
    "horaires ferry Moorea",
    "météo Moorea",
    "tourisme Moorea",
    "que faire Moorea",
    "MooreaNews",
  ],
  authors: [{ name: SITE.name, url: getSiteOrigin() }],
  creator: SITE.name,
  publisher: SITE.name,
  alternates: {
    languages: {
      "fr-PF": getSiteOrigin(),
      en: `${getSiteOrigin()}/en`,
    },
    types: {
      "application/rss+xml": "/actualites/feed.xml",
    },
  },
  verification: {
    google: googleSiteVerification(),
    other: bingSiteVerification()
      ? { "msvalidate.01": bingSiteVerification()! }
      : undefined,
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: getSiteOrigin(),
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

/** Pied de page (pubs) + chrome — cache 10 min pour limiter le CPU Vercel. */
export const revalidate = 600;

export async function generateViewport(): Promise<Viewport> {
  const seasonTheme = await getActiveSeasonTheme();
  const color = seasonThemeColor(seasonTheme);
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color },
      {
        media: "(prefers-color-scheme: dark)",
        color: seasonTheme ? color : "#0c4a6e",
      },
    ],
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sponsorItems, seasonTheme] = await Promise.all([
    getFooterSponsorStripItems(),
    getActiveSeasonTheme(),
  ]);

  return (
    <html
      lang="fr"
      className={`${inter.variable} ${marcellus.variable} antialiased`}
      data-season={seasonTheme ?? undefined}
    >
      <body className="min-h-screen flex flex-col bg-island-sky bg-palm-pattern text-ocean-950 dark:bg-ocean-950 dark:text-ocean-50">
        <SeasonalDecor theme={seasonTheme} />
        <JsonLd data={webSiteJsonLd()} />
        <SiteChrome
          sponsorItems={sponsorItems}
          seasonTheme={seasonTheme}
          seasonRibbon={
            seasonTheme ? (
              <SeasonalThemeRibbon theme={seasonTheme} />
            ) : null
          }
        >
          {children}
        </SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}
