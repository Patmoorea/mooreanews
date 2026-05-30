"use client";

import { Printer } from "lucide-react";

export function PrintPackButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ocean-900 text-white text-sm font-semibold hover:bg-ocean-800"
    >
      <Printer size={16} />
      Imprimer / Enregistrer en PDF
    </button>
  );
}
