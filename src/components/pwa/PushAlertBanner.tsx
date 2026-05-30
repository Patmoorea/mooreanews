"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import {
  isPushMarkedActive,
  isPushSupported,
  subscribeToPushAlerts,
} from "@/lib/push-client";

const DISMISS_KEY = "mooreanews-push-banner-dismiss";

export function PushAlertBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (isPushMarkedActive()) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  async function activate() {
    setLoading(true);
    setMessage(null);
    const result = await subscribeToPushAlerts([]);
    if (result.ok) {
      setMessage("Alertes activées pour toute l'île.");
      setTimeout(() => setVisible(false), 2500);
    } else if (result.reason === "denied") {
      setMessage("Autorisez les notifications dans votre navigateur.");
    } else {
      setMessage(result.message ?? "Activation impossible.");
    }
    setLoading(false);
  }

  return (
    <div className="bg-gradient-to-r from-ocean-900 via-lagon-900 to-ocean-900 text-white border-b border-lagon-700/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Bell size={16} className="text-lagon-300 shrink-0" />
            Coupure eau, EDT, houle, ferry — alertes instantanées
          </p>
          <p className="text-xs text-ocean-200 mt-0.5">
            Gratuit · par quartier sur{" "}
            <Link href="/alertes" className="underline hover:text-white">
              /alertes
            </Link>
          </p>
          {message && <p className="text-xs text-lagon-200 mt-1">{message}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={activate}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-white text-ocean-900 text-sm font-semibold hover:bg-lagon-100 disabled:opacity-60"
          >
            {loading ? "…" : "Activer"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="p-2 rounded-full hover:bg-white/10"
            aria-label="Masquer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
