import { getInfoBannerConfig } from "@/lib/constants";
import { InfoBanner } from "@/components/layout/InfoBanner";

export function InfoBannerSlot() {
  const config = getInfoBannerConfig();
  return <InfoBanner {...config} />;
}
