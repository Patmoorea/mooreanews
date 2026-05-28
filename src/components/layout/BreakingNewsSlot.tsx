"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Siren, X } from "lucide-react";
import type { AlertRow } from "@/lib/supabase/types";

type ApiResponse = { ok: boolean; alerts: AlertRow[] };

export function BreakingNewsSlot() {
  const [dismissed, setDismissed] = useState(false);
  const [urgent, setUrgent] = useState<AlertRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as ApiResponse;
        const top = (json.alerts ?? []).find((a) => a.urgent && a.active) ?? null;
        if (!cancelled) setUrgent(top);
      } catch {
        // ignore
      }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (dismissed || !urgent) return null;

  return (
    <div className="relative bg-gradient-to-r from-tiare-600 via-couchant to-soleil-500 text-white">
      <div className="mx-auto max-w-7xl px-4 py-2.5 pr-12">
        <Link
          href="/alertes"
          className="flex items-center justify-center gap-2 text-sm font-semibold hover:opacity-95"
        >
          <Siren size={18} />
          <span className="uppercase tracking-widest text-[11px] bg-white/20 px-2 py-0.5 rounded-full">
            Breaking news
          </span>
          <span className="truncate max-w-[72ch]">{urgent.title}</span>
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
        aria-label="Fermer le bandeau"
      >
        <X size={16} />
      </button>
    </div>
  );
}

