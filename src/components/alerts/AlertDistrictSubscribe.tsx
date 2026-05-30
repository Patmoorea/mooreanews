"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Mail, MapPin, Check } from "lucide-react";
import { MOOREA_DISTRICTS } from "@/lib/constants";
import {
  isPushMarkedActive,
  isPushSupported,
  markPushActive,
  subscribeToPushAlerts,
  syncPushDistricts,
} from "@/lib/push-client";

const STORAGE_KEY = "mooreanews-alert-districts";

export function AlertDistrictSubscribe({
  onDistrictsChange,
}: {
  onDistrictsChange?: (districts: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [pushState, setPushState] = useState<
    "idle" | "loading" | "ok" | "unsupported" | "denied" | "error"
  >("idle");
  const [emailState, setEmailState] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setSelected(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    onDistrictsChange?.(selected);
  }, [selected, onDistrictsChange]);

  useEffect(() => {
    if (!isPushMarkedActive() || !isPushSupported()) return;
    const t = setTimeout(() => {
      syncPushDistricts(selected);
    }, 600);
    return () => clearTimeout(t);
  }, [selected]);

  const toggleDistrict = useCallback((d: string) => {
    setSelected((prev) => {
      const next = prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const allIsland = selected.length === 0;

  const districtLabel = useMemo(() => {
    if (allIsland) return "Toute l'île";
    return selected.join(", ");
  }, [allIsland, selected]);

  async function subscribePush() {
    setPushState("loading");
    setMessage("");
    if (!isPushSupported()) {
      setPushState("unsupported");
      return;
    }
    const result = await subscribeToPushAlerts(selected);
    if (result.ok) {
      setPushState("ok");
      setMessage(`Notifications activées (${districtLabel}).`);
    } else if (result.reason === "denied") {
      setPushState("denied");
      markPushActive(false);
    } else if (result.reason === "not_configured") {
      setPushState("error");
      setMessage(result.message ?? "Push non configuré sur le serveur.");
    } else {
      setPushState("error");
      setMessage(result.message ?? "Impossible d'activer les notifications push.");
    }
  }

  async function subscribeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, districts: selected }),
      });
      if (!res.ok) throw new Error("failed");
      setEmailState("ok");
      setMessage(`Alertes email activées pour ${districtLabel}.`);
      setEmail("");
    } catch {
      setEmailState("error");
      setMessage("Inscription email impossible.");
    }
  }

  return (
    <section className="bg-gradient-to-br from-ocean-900 to-lagon-900 rounded-3xl p-6 sm:p-8 text-white mb-10">
      <div className="flex items-center gap-2 text-lagon-200 text-xs font-semibold uppercase tracking-widest mb-2">
        <MapPin size={14} />
        Alertes par quartier
      </div>
      <h2 className="font-display text-2xl">Recevoir les alertes qui vous concernent</h2>
      <p className="mt-2 text-sm text-ocean-200 max-w-2xl">
        Sélectionnez vos quartiers (ou laissez vide pour toute l&apos;île), puis
        activez les notifications push ou par email. Le détail reste sur le site.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setSelected([]);
            localStorage.setItem(STORAGE_KEY, "[]");
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            allIsland
              ? "bg-white text-ocean-900"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          Toute l&apos;île
        </button>
        {MOOREA_DISTRICTS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => toggleDistrict(d)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              selected.includes(d)
                ? "bg-lagon-400 text-ocean-950"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={subscribePush}
          disabled={pushState === "loading"}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-ocean-900 font-semibold text-sm hover:bg-lagon-100 transition-colors disabled:opacity-60"
        >
          {pushState === "ok" ? <Check size={16} /> : <Bell size={16} />}
          {pushState === "ok" ? "Push activé" : "Activer notifications push"}
        </button>

        <form onSubmit={subscribeEmail} className="flex flex-1 gap-2 min-w-0">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email alertes quartier"
            className="flex-1 min-w-0 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-ocean-300 text-sm"
          />
          <button
            type="submit"
            disabled={emailState === "loading"}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-lagon-500 font-semibold text-sm hover:bg-lagon-400 disabled:opacity-60"
          >
            <Mail size={16} />
            Email
          </button>
        </form>
      </div>

      {message && (
        <p className="mt-4 text-sm text-lagon-200">{message}</p>
      )}
      {pushState === "unsupported" && (
        <p className="mt-4 text-sm text-soleil-200">
          Push non supporté — installez l&apos;app PWA ou utilisez l&apos;email.
        </p>
      )}
    </section>
  );
}

export function loadStoredDistrictFilter(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function alertMatchesDistrictFilter(
  alertDistrict: string | null,
  filter: string[],
): boolean {
  if (filter.length === 0) return true;
  if (!alertDistrict) return true;
  return filter.includes(alertDistrict);
}
