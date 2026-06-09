import Link from "next/link";
import { Container } from "@/components/ui/Container";
import type { AdCampaign } from "@/lib/ads-types";
import { AdBannerLink } from "@/components/ads/AdBannerLink";
import { AdBannerImage } from "@/components/ads/AdBannerImage";

export function AdSponsorsStrip({ campaigns }: { campaigns: AdCampaign[] }) {
  if (campaigns.length === 0) return null;

  return (
    <div className="border-t border-ocean-800/60 py-8">
      <Container>
        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-ocean-400 font-semibold mb-4">
          Nos partenaires locaux
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {campaigns.map((c) => (
            <AdBannerLink
              key={c.id}
              href={c.href}
              slotId="footer-sponsors"
              campaignId={c.id}
              className="block rounded-xl overflow-hidden ring-1 ring-ocean-700/50 hover:ring-lagon-400 transition-all opacity-90 hover:opacity-100 max-w-[320px] sm:max-w-[420px]"
            >
              <AdBannerImage
                src={c.image}
                alt={c.alt}
                width={c.imageWidth}
                height={c.imageHeight}
                sizes="420px"
                className="max-h-24 sm:max-h-28 object-contain"
              />
            </AdBannerLink>
          ))}
          <Link
            href="/partenaires"
            className="text-xs font-semibold text-lagon-300 hover:text-white underline-offset-2 hover:underline px-3"
          >
            Devenir partenaire
          </Link>
        </div>
      </Container>
    </div>
  );
}
