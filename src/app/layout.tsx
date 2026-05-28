import type { Metadata, Viewport } from "next";
import { Inter, Marcellus } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InfoBannerSlot } from "@/components/layout/InfoBannerSlot";
import { BreakingNewsSlot } from "@/components/layout/BreakingNewsSlot";
import { Ticker } from "@/components/widgets/Ticker";
import { SITE } from "@/lib/constants";

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
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "Moorea",
    "Tahiti",
    "Polynésie française",
    "actualités",
    "événements",
    "annonces",
    "restaurants",
    "ferries",
    "météo Moorea",
    "Tiahura",
    "Maharepa",
    "Paopao",
    "tourisme",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#06b6d4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c4a6e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${marcellus.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-island-sky bg-palm-pattern text-ocean-950">
        <InfoBannerSlot />
        <BreakingNewsSlot />
        <Header />
        <Ticker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
