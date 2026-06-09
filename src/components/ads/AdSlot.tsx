import { Megaphone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { resolveAdSlot } from "@/lib/ads-data";
import type { AdFormat } from "@/lib/ads-types";
import { AdBannerLink } from "@/components/ads/AdBannerLink";
import { AdBannerImage } from "@/components/ads/AdBannerImage";

type Props = {
  slotId: string;
  fullBleed?: boolean;
  className?: string;
  hideLabel?: boolean;
};

const FORMAT_CLASS: Record<AdFormat, { wrap: string; sizes: string }> = {
  leaderboard: {
    wrap: "max-w-5xl mx-auto",
    sizes: "(max-width: 1280px) 100vw, 1200px",
  },
  billboard: {
    wrap: "max-w-4xl mx-auto",
    sizes: "(max-width: 1024px) 100vw, 960px",
  },
  rectangle: {
    wrap: "max-w-2xl mx-auto",
    sizes: "(max-width: 768px) 100vw, 640px",
  },
  sidebar: {
    wrap: "max-w-xs mx-auto lg:mx-0",
    sizes: "320px",
  },
  card: {
    wrap: "h-full",
    sizes: "(max-width: 640px) 100vw, 400px",
  },
  ribbon: {
    wrap: "max-w-md mx-auto",
    sizes: "(max-width: 768px) 90vw, 420px",
  },
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
  const fmt = FORMAT_CLASS[slot.format];
  const isCard = slot.format === "card";

  const inner = (
    <div
      className={cn(
        "group relative",
        fmt.wrap,
        isCard &&
          "flex flex-col bg-white rounded-2xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:border-tiare-200 transition-all",
      )}
    >
      {!hideLabel && (
        <p className="mb-2 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-ocean-400 font-semibold">
          <Megaphone size={11} aria-hidden />
          Partenaire local
          {campaign.sponsor ? (
            <span className="text-ocean-500 normal-case tracking-normal font-medium">
              · {campaign.sponsor}
            </span>
          ) : null}
        </p>
      )}

      <AdBannerLink
        href={campaign.href}
        slotId={slot.id}
        campaignId={campaign.id}
        className={cn(
          "block ring-1 ring-ocean-100/80 bg-ocean-50 hover:ring-tiare-300 transition-all",
          isCard ? "flex-1 rounded-none ring-0 overflow-hidden" : "rounded-2xl shadow-sm hover:shadow-md overflow-hidden",
        )}
      >
        <AdBannerImage
          src={campaign.image}
          alt={campaign.alt}
          width={campaign.imageWidth}
          height={campaign.imageHeight}
          sizes={fmt.sizes}
        />
      </AdBannerLink>

      {isCard && (
        <div className="p-4 border-t border-ocean-100">
          <p className="font-display text-lg text-ocean-900">{campaign.name}</p>
          <p className="mt-1 text-xs text-ocean-600 line-clamp-2">{campaign.alt}</p>
          <span className="mt-2 inline-block text-xs font-semibold text-tiare-600 group-hover:underline">
            Découvrir →
          </span>
        </div>
      )}
    </div>
  );

  if (fullBleed || slot.format === "leaderboard" || slot.format === "billboard") {
    return (
      <aside
        aria-label={`Publicité partenaire — ${campaign.name}`}
        className={cn(
          "py-6 sm:py-8",
          slot.format === "leaderboard" && "bg-gradient-to-b from-ocean-50/80 to-white",
          slot.format === "billboard" && "bg-white",
          className,
        )}
      >
        <Container>{inner}</Container>
      </aside>
    );
  }

  if (slot.format === "ribbon") {
    return (
      <aside
        aria-label={`Partenaire — ${campaign.name}`}
        className={cn("py-4", className)}
      >
        {inner}
      </aside>
    );
  }

  return (
    <aside
      aria-label={`Publicité partenaire — ${campaign.name}`}
      className={cn("py-4", className)}
    >
      {inner}
    </aside>
  );
}
