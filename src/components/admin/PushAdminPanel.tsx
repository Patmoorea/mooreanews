"use client";

import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { adminSendTestPush } from "@/app/admin/push-actions";

export function PushAdminPanel({
  pushSubscribers,
  emailSubscribers,
  vapidOk,
  tableOk,
}: {
  pushSubscribers: number;
  emailSubscribers: number;
  vapidOk: boolean;
  tableOk: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function sendTest() {
    setLoading(true);
    setResult(null);
    try {
      const r = await adminSendTestPush();
      if (r.sent > 0) {
        setResult(`✅ ${r.sent} notification(s) envoyée(s).`);
      } else if (r.errors.length > 0) {
        setResult(`⚠️ ${r.errors[0]}`);
      } else {
        setResult(
          "Aucun abonné push — activez d'abord les notifications sur /alertes.",
        );
      }
    } catch (e) {
      setResult(`Erreur : ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const ready = vapidOk && tableOk;

  return (
    <div className="mb-6 rounded-2xl border border-ocean-200 bg-white p-5">
      <div className="flex items-center gap-2 text-ocean-900 font-semibold">
        <Bell size={18} className="text-lagon-600" />
        Notifications push
      </div>
      <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-ocean-500 text-xs">VAPID</dt>
          <dd className={vapidOk ? "text-tipanier-700 font-medium" : "text-amber-700"}>
            {vapidOk ? "Configuré" : "Manquant"}
          </dd>
        </div>
        <div>
          <dt className="text-ocean-500 text-xs">Abonnés push</dt>
          <dd className="font-semibold text-ocean-900">{pushSubscribers}</dd>
        </div>
        <div>
          <dt className="text-ocean-500 text-xs">Abonnés email alertes</dt>
          <dd className="font-semibold text-ocean-900">{emailSubscribers}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-ocean-600">
        {ready
          ? "Les alertes créées en admin déclenchent automatiquement push + email quartier."
          : "Finalisez VAPID (Vercel) + SQL prod-setup-all.sql pour activer le push."}
      </p>
      <button
        type="button"
        onClick={sendTest}
        disabled={loading || !ready}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ocean-800 text-white text-sm font-semibold hover:bg-ocean-900 disabled:opacity-50"
      >
        <Send size={14} />
        {loading ? "Envoi…" : "Envoyer notification test"}
      </button>
      {result && <p className="mt-3 text-sm text-ocean-700">{result}</p>}
    </div>
  );
}
