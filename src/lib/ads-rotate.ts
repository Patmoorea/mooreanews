import type { AdCampaign } from "@/lib/ads-types";

/** Durée d’affichage d’une campagne sur un emplacement avant alternance. */
export const AD_ROTATION_MS = 30 * 60 * 1000;

function hashSlot(slotId: string, bucket: number): number {
  let h = bucket >>> 0;
  for (let i = 0; i < slotId.length; i++) {
    h = (Math.imul(31, h) + slotId.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Choisit une campagne dans le pool — même slot = même pub pendant AD_ROTATION_MS. */
export function pickRotatingCampaign(
  slotId: string,
  pool: AdCampaign[],
  at = Date.now(),
): AdCampaign | null {
  const active = pool.filter((c) => c.active);
  if (active.length === 0) return null;
  const sorted = [...active].sort((a, b) => a.id.localeCompare(b.id));
  const bucket = Math.floor(at / AD_ROTATION_MS);
  return sorted[hashSlot(slotId, bucket) % sorted.length] ?? null;
}

export function listActiveCampaigns(
  campaigns: Record<string, AdCampaign>,
): AdCampaign[] {
  return Object.values(campaigns)
    .filter((c) => c.active)
    .sort((a, b) => (a.sponsor ?? a.name).localeCompare(b.sponsor ?? b.name));
}
