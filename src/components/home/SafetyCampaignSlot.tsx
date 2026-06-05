import { getActiveSiteCampaign } from "@/lib/site-campaigns";
import { SafetyCampaignSpotlight } from "@/components/home/SafetyCampaignSpotlight";

/** Campagne institutionnelle en une (affiche « Rentrez vivants », etc.). */
export function SafetyCampaignSlot() {
  const campaign = getActiveSiteCampaign();
  if (!campaign) return null;
  return <SafetyCampaignSpotlight campaign={campaign} />;
}
