import { getFeaturedOutageForDisplay } from "@/lib/outage-display-server";
import { HeroOutageStickerClient } from "@/components/home/HeroOutageStickerClient";

/** Pastille coupure sur le hero — données serveur, rendu client (icônes). */
export async function HeroOutageSticker() {
  const outage = await getFeaturedOutageForDisplay();
  return <HeroOutageStickerClient outage={outage} />;
}
