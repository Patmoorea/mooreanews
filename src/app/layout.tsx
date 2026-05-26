import type { Metadata, Viewport } from "next";
import { Inter, Marcellus, Pacifico } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const marcellus = Marcellus({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-marcellus",
  display: "swap",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://mooreanews.com"
  ),
  title: {
    default: "Moorea Hub — Le portail de l'île de Moorea",
    template: "%s · Moorea Hub",
  },
  description:
    "Toute l'actualité, les événements, annonces et infos pratiques de Moorea en temps réel. Météo, marées, ferries, restaurants et plus.",
  keywords: [
    "Moorea",
    "Polynésie française",
    "Tahiti",
    "actualités Moorea",
    "événements Moorea",
    "ferries Moorea Tahiti",
    "météo Moorea",
    "restaurants Moorea",
  ],
  openGraph: {
    type: "website",
    locale: "fr_PF",
    url: "/",
    siteName: "Moorea Hub",
    title: "Moorea Hub — Le portail de l'île de Moorea",
    description:
      "Toute l'actualité, les événements et infos pratiques de Moorea en temps réel.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`${inter.variable} ${marcellus.variable} ${pacifico.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
