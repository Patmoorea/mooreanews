import { ArticlesFilterClient } from "@/components/ArticlesFilterClient";
import { AdSlot } from "@/components/ads/AdSlot";
import type { Article } from "@/lib/content-types";

type Props = {
  articles: Article[];
  showInlineAds?: boolean;
};

export function ArticlesFilter({ articles, showInlineAds = false }: Props) {
  return (
    <ArticlesFilterClient
      articles={articles}
      showInlineAds={showInlineAds}
      inlineAd={showInlineAds ? <AdSlot slotId="actualites-inline" /> : undefined}
    />
  );
}
