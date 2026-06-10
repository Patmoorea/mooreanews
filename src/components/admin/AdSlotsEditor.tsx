"use client";

import { useTransition } from "react";
import { updateAdSlot } from "@/app/admin/ads-actions";
import { FOOTER_SPONSOR_SLOT_PREFIX } from "@/lib/ads-sponsors";
import { AD_ROTATION_MS } from "@/lib/ads-rotate";
import { AD_FORMAT_LABELS, type AdCampaignRow, type AdSlotRow } from "@/lib/ads-types";

type Props = {
  slots: AdSlotRow[];
  campaigns: AdCampaignRow[];
};

function rotationMinutes(): number {
  return Math.round(AD_ROTATION_MS / 60_000);
}

function SlotTable({
  rows,
  pending,
  onToggle,
  mode,
  activeNames,
}: {
  rows: AdSlotRow[];
  pending: boolean;
  onToggle: (slotId: string, enabled: boolean) => void;
  mode: "page" | "footer";
  activeNames: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
          <tr>
            <th className="px-4 py-3 text-left">Emplacement</th>
            <th className="px-4 py-3 text-left hidden md:table-cell">Format</th>
            <th className="px-4 py-3 text-left">
              {mode === "page" ? "Campagnes" : "Affichage"}
            </th>
            <th className="px-4 py-3 text-center">Actif</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ocean-100">
          {rows.map((slot) => (
            <tr key={slot.id} className="hover:bg-ocean-50/40">
              <td className="px-4 py-3">
                <p className="font-medium text-ocean-900">{slot.label}</p>
                <p className="text-[10px] text-ocean-400 font-mono mt-0.5">{slot.id}</p>
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-ocean-600 text-xs">
                {AD_FORMAT_LABELS[slot.format]}
              </td>
              <td className="px-4 py-3 text-ocean-700 text-xs leading-relaxed">
                {mode === "page" ? (
                  <>
                    <span className="font-semibold text-tiare-700">↻ Alternance auto</span>
                    <span className="block mt-0.5 text-ocean-500">
                      Toutes les campagnes actives ({activeNames}) — change toutes les{" "}
                      {rotationMinutes()} min
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-tiare-700">Rubans côte à côte</span>
                    <span className="block mt-0.5 text-ocean-500">
                      Toutes les campagnes actives ({activeNames}) sur toutes les pages
                    </span>
                  </>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={slot.enabled}
                  disabled={pending}
                  onChange={(e) => onToggle(slot.id, e.target.checked)}
                  className="h-4 w-4 rounded border-ocean-300"
                  aria-label={`Activer ${slot.label}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdSlotsEditor({ slots, campaigns }: Props) {
  const [pending, startTransition] = useTransition();

  const pageSlots = slots.filter((s) => !s.id.startsWith(FOOTER_SPONSOR_SLOT_PREFIX));
  const footerSlots = slots.filter((s) => s.id.startsWith(FOOTER_SPONSOR_SLOT_PREFIX));
  const activeNames =
    campaigns
      .filter((c) => c.active)
      .map((c) => c.sponsor ?? c.name)
      .join(", ") || "aucune";

  function onToggle(slotId: string, enabled: boolean) {
    const slot = slots.find((s) => s.id === slotId);
    const fd = new FormData();
    fd.set("slot_id", slotId);
    fd.set("campaign_id", slot?.campaign_id ?? "");
    fd.set("enabled", enabled ? "on" : "off");
    startTransition(() => updateAdSlot(fd));
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-tiare-200 bg-tiare-50/80 px-4 py-3 text-sm text-ocean-800">
        <strong>Pas de choix manuel par emplacement.</strong> Dès qu&apos;une campagne est active
        (Maitai, RAI TAHITI, etc.), elle entre automatiquement dans l&apos;alternance sur les
        pages et apparaît en ruban dans le pied de page.
      </div>
      <SlotTable
        rows={pageSlots}
        pending={pending}
        onToggle={onToggle}
        mode="page"
        activeNames={activeNames}
      />
      {footerSlots.length > 0 ? (
        <section>
          <h3 className="font-display text-lg text-ocean-950 mb-2">
            Pied de page — partenaires
          </h3>
          <SlotTable
            rows={footerSlots}
            pending={pending}
            onToggle={onToggle}
            mode="footer"
            activeNames={activeNames}
          />
        </section>
      ) : (
        <section className="rounded-xl border border-ocean-100 bg-ocean-50/60 px-4 py-3 text-sm text-ocean-700">
          Pied de page : toutes les campagnes actives s&apos;affichent en ruban 468×60
          ({activeNames}).
        </section>
      )}
      {pending ? (
        <p className="text-xs text-ocean-500">Enregistrement…</p>
      ) : null}
    </div>
  );
}
