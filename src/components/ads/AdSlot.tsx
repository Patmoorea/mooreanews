import { Megaphone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { AD_FORMAT_DISPLAY } from "@/lib/ad-format-sizes";
import { getCampaignImageForSlot } from "@/lib/ads-campaign-images";
import { resolveAdSlot } from "@/lib/ads-data";
import { AdBannerLink } from "@/components/ads/AdBannerLink";
import { AdBannerFrame } from "@/components/ads/AdBannerFrame";

type Props = {
  slotId: string;
  fullBleed?: boolean;
  className?: string;
  hideLabel?: boolean;
};

export async function AdSlot({
  slotId,
  fullBleed,
  className,
  hideLabel = false,
}: Props) {
  const resolved = await resolveAdSlot(slotId);
  if (!resolved) return null;

  const { slot, campaign } = resolved;
  const spec = AD_FORMAT_DISPLAY[slot.format];
  const bannerSrc = getCampaignImageForSlot(campaign, slot.format, slot.id);
  if (!bannerSrc) return null;
  const isCard = slot.format === "card";

  const inner = (
    <div
      className={cn(
        "group relative mx-auto",
        isCard ? "max-w-[300px] w-full" : "w-full",
        isCard &&
          "flex flex-col bg-white rounded-xl border border-ocean-100 overflow-hidden shadow-sm hover:shadow-md hover:border-tiare-200 transition-all",
      )}
    >
      {!hideLabel && (
        <p className="mb-1.5 flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-ocean-400 font-semibold">
          <Megaphone size={10} aria-hidden />
          Publicité
          {campaign.sponsor ? (
            <span className="text-ocean-500 normal-case tracking-normal font-medium">
              · {campaign.sponsor}
            </span>
          ) : null}
          <span className="text-ocean-300 hidden sm:inline">· {spec.label}</span>
        </p>
      )}

      <AdBannerLink
        href={campaign.href}
        slotId={slot.id}
        campaignId={campaign.id}
        className={cn(
          "block overflow-hidden ring-1 ring-ocean-100/80 hover:ring-tiare-300 transition-all",
          isCard ? "rounded-none ring-0" : "rounded-lg",
        )}
      >
        <AdBannerFrame
          src={bannerSrc}
          alt={campaign.alt}
          format={slot.format}
        />
      </AdBannerLink>

      {isCard && (
        <div className="p-3 border-t border-ocean-100">
          <p className="font-semibold text-sm text-ocean-900 line-clamp-1">
            {campaign.name}
          </p>
          <span className="mt-1 inline-block text-xs font-semibold text-tiare-600 group-hover:underline">
            En savoir plus →
          </span>
        </div>
      )}
    </div>
  );

  const compact = slot.format === "leaderboard" || slot.format === "ribbon";

  if (fullBleed || slot.format === "leaderboard" || slot.format === "billboard") {
    return (
      <aside
        aria-label={`Publicité — ${campaign.name}`}
        className={cn(
          compact ? "py-3" : "py-4 sm:py-5",
          slot.format === "leaderboard" && "bg-ocean-50/50",
          className,
        )}
      >
        <Container>{inner}</Container>
      </aside>
    );
  }

  if (slot.format === "ribbon") {
    return (
      <aside aria-label={`Partenaire — ${campaign.name}`} className={cn("py-2", className)}>
        {inner}
      </aside>
    );
  }

  return (
    <aside
      aria-label={`Publicité — ${campaign.name}`}
      className={cn("py-3", className)}
    >
      <Container size={slot.format === "rectangle" ? "narrow" : "default"}>
        {inner}
      </Container>
    </aside>
  );
}
