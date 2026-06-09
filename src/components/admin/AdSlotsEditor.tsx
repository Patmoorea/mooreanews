"use client";

import { useTransition } from "react";
import { updateAdSlot } from "@/app/admin/ads-actions";
import { AD_FORMAT_LABELS, type AdCampaignRow, type AdSlotRow } from "@/lib/ads-types";

type Props = {
  slots: AdSlotRow[];
  campaigns: AdCampaignRow[];
};

export function AdSlotsEditor({ slots, campaigns }: Props) {
  const [pending, startTransition] = useTransition();

  function onChange(slotId: string, field: "campaign_id" | "enabled", value: string | boolean) {
    const fd = new FormData();
    fd.set("slot_id", slotId);
    const slot = slots.find((s) => s.id === slotId);
    fd.set("campaign_id", field === "campaign_id" ? String(value) : slot?.campaign_id ?? "");
    fd.set("enabled", field === "enabled" ? (value ? "on" : "off") : slot?.enabled ? "on" : "off");
    startTransition(() => updateAdSlot(fd));
  }

  return (
    <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
          <tr>
            <th className="px-4 py-3 text-left">Emplacement</th>
            <th className="px-4 py-3 text-left hidden md:table-cell">Format</th>
            <th className="px-4 py-3 text-left">Campagne</th>
            <th className="px-4 py-3 text-center">Actif</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ocean-100">
          {slots.map((slot) => (
            <tr key={slot.id} className="hover:bg-ocean-50/40">
              <td className="px-4 py-3">
                <p className="font-medium text-ocean-900">{slot.label}</p>
                <p className="text-[10px] text-ocean-400 font-mono mt-0.5">{slot.id}</p>
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-ocean-600 text-xs">
                {AD_FORMAT_LABELS[slot.format]}
              </td>
              <td className="px-4 py-3">
                <select
                  className="w-full max-w-xs px-3 py-2 rounded-xl border border-ocean-200 text-sm"
                  value={slot.campaign_id ?? ""}
                  disabled={pending}
                  onChange={(e) => onChange(slot.id, "campaign_id", e.target.value)}
                >
                  <option value="">— Aucune —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{!c.active ? " (inactive)" : ""}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={slot.enabled}
                  disabled={pending}
                  onChange={(e) => onChange(slot.id, "enabled", e.target.checked)}
                  className="h-4 w-4 rounded border-ocean-300"
                  aria-label={`Activer ${slot.label}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pending ? (
        <p className="px-4 py-2 text-xs text-ocean-500 border-t border-ocean-100">
          Enregistrement…
        </p>
      ) : null}
    </div>
  );
}
