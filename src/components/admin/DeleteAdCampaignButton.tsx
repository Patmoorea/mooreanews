"use client";

import { deleteAdCampaign } from "@/app/admin/ads-actions";

export function DeleteAdCampaignButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form action={deleteAdCampaign}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm text-red-600 hover:text-red-800 font-semibold"
        onClick={(e) => {
          if (!confirm(`Supprimer la campagne « ${name} » ?`)) e.preventDefault();
        }}
      >
        Supprimer
      </button>
    </form>
  );
}
