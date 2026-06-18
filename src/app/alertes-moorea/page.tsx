import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CloudLightning,
  Ship,
  Siren,
  Zap,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ShareButtons } from "@/components/ShareButtons";
import { TelegramCommunityPromo } from "@/components/telegram/TelegramCommunityPromo";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, buildPageShareMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { siteLinkUtm } from "@/lib/utm";

const TITLE = "Alertes Moorea — infos temps réel";
const DESCRIPTION =
  "Coupures EDT, eau, route, ferry, houle et météo à Moorea. Recevez les alertes en direct sur votre téléphone — gratuit.";

export const metadata: Metadata = buildPageShareMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/alertes-moorea",
  imageUrl: "/brand/banner.png",
});

const FEATURES = [
  {
    icon: Zap,
    title: "Coupures & eau",
    text: "EDT, TIE, route — par quartier",
  },
  {
    icon: Ship,
    title: "Ferry & houle",
    text: "Traversées Tahiti–Moorea, conditions mer",
  },
  {
    icon: CloudLightning,
    title: "Météo & cyclone",
    text: "Vigilance Météo France, alertes locales",
  },
];

export default function AlertesMooreaLandingPage() {
  const shareUrl = absoluteUrl("/alertes-moorea");
  const alertesUrl = siteLinkUtm("/alertes", "whatsapp", "alertes_moorea");

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-950 to-tiare-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,113,133,0.2),transparent_55%)]"
        />
        <Container className="relative py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
              <Siren size={14} className="text-tiare-300" />
              Temps réel · Moorea
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl text-balance leading-tight">
              Alertes Moorea
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-white/85 text-pretty">
              {DESCRIPTION}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Link
                href="/alertes"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-tiare-400 to-tiare-600 px-8 py-4 text-base font-bold text-white shadow-lg hover:-translate-y-0.5 transition-transform"
              >
                Voir les alertes actives
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/telecharger"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20"
              >
                <Bell size={18} />
                Activer les notifications
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-2xl text-ocean-950 text-center mb-6">
            Partagez avec votre entourage
          </h2>
          <ShareButtons
            url={shareUrl}
            title={`${TITLE} — ${SITE.name}`}
            description={DESCRIPTION}
            variant="article"
            utmContent="landing_alertes"
          />
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-ocean-100 bg-white p-6 text-center shadow-sm"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-lagon-100 text-lagon-700">
                  <Icon size={24} />
                </span>
                <h3 className="mt-4 font-display text-lg text-ocean-900">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-ocean-600">{f.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-14 max-w-2xl mx-auto">
          <TelegramCommunityPromo variant="page" />
        </div>

        <p className="mt-10 text-center text-sm text-ocean-500">
          Lien direct alertes :{" "}
          <a href={alertesUrl} className="text-lagon-600 hover:underline">
            mooreanews.com/alertes
          </a>
        </p>
      </Container>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: shareUrl,
          isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
          about: { "@type": "Place", name: "Moorea" },
        }}
      />
    </>
  );
}
