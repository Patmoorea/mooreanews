import { Droplets, Zap } from "lucide-react";
import { HeroStickerVignette } from "@/components/home/HeroStickerVignette";
import {
  isOutageInProgress,
  outageStickerLabel,
} from "@/lib/outage-display";
import { getFeaturedOutageForDisplay } from "@/lib/outage-display-server";

/** Pastille coupure sur le hero — lecture DB rapide (pas de fetch lourd). */
export async function HeroOutageSticker() {
  const outage = await getFeaturedOutageForDisplay();
  if (!outage) return null;

  const isEdt = outage.kind === "coupure_edt";
  const Icon = isEdt ? Zap : Droplets;
  const inProgress = isOutageInProgress(outage);

  return (
    <HeroStickerVignette
      href="/coupures"
      label={outageStickerLabel(outage)}
      icon={Icon}
      accent={
        inProgress
          ? "from-red-600/55 to-orange-600/45"
          : "from-red-700/45 to-orange-700/35"
      }
      pulse={inProgress}
      className="ring-1 ring-red-400/45"
    />
  );
}
