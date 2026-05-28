"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Siren, Power, PowerOff } from "lucide-react";
import { toggleAlertActive, toggleAlertUrgent } from "@/app/admin/actions";

export function AlertRowActions({
  id,
  active,
  urgent,
}: {
  id: string;
  active: boolean;
  urgent: boolean;
}) {
  const router = useRouter();

  async function onToggleActive() {
    await toggleAlertActive(id, active);
    router.refresh();
  }

  async function onToggleUrgent() {
    await toggleAlertUrgent(id, urgent);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onToggleActive}
        title={active ? "Désactiver" : "Activer"}
        className={`p-1.5 rounded-lg transition-colors ${
          active ? "text-tipanier-700 hover:bg-tipanier-50" : "text-ocean-400 hover:bg-ocean-50"
        }`}
      >
        {active ? <Power size={16} /> : <PowerOff size={16} />}
      </button>
      <button
        type="button"
        onClick={onToggleUrgent}
        title={urgent ? "Retirer BREAKING" : "Mettre en BREAKING"}
        className={`p-1.5 rounded-lg transition-colors ${
          urgent ? "text-tiare-700 hover:bg-tiare-50" : "text-ocean-400 hover:bg-ocean-50"
        }`}
      >
        <Siren size={16} className={urgent ? "" : "opacity-40"} />
      </button>
      <Link
        href={`/admin/alerts/${id}`}
        title="Éditer"
        className="p-1.5 rounded-lg text-lagon-600 hover:bg-lagon-50"
      >
        <Pencil size={16} />
      </Link>
    </div>
  );
}

