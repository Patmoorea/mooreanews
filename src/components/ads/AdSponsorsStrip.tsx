import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getCampaignImageForSlot } from "@/lib/ads-campaign-images";
import type { AdSponsorStripItem } from "@/lib/ads-sponsors";
import { AdBannerLink } from "@/components/ads/AdBannerLink";
import { AdBannerFrame } from "@/components/ads/AdBannerFrame";

export function AdSponsorsStrip({ items }: { items: AdSponsorStripItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="border-t border-ocean-800/60 py-5">
      <Container>
        <p className="text-center text-[9px] uppercase tracking-[0.2em] text-ocean-400 font-semibold mb-3">
          Partenaires locaux
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {items.map(({ slotId, campaign }) => (
            <AdBannerLink
              key={slotId}
              href={campaign.href}
              slotId={slotId}
              campaignId={campaign.id}
              className="block rounded-lg overflow-hidden ring-1 ring-ocean-700/50 hover:ring-lagon-400 transition-all opacity-90 hover:opacity-100 w-full max-w-[468px] sm:w-auto sm:flex-1 sm:min-w-[280px] sm:max-w-[468px]"
            >
              <AdBannerFrame
                src={getCampaignImageForSlot(campaign, "ribbon", slotId)}
                alt={campaign.alt}
                format="ribbon"
              />
            </AdBannerLink>
          ))}
          <Link
            href="/partenaires"
            className="text-xs font-semibold text-lagon-300 hover:text-white underline-offset-2 hover:underline px-2"
          >
            Devenir partenaire
          </Link>
        </div>
      </Container>
    </div>
  );
}
