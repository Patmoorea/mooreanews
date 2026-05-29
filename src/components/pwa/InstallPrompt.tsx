"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa-install-dismissed") === "1") {
      setHidden(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (hidden || !deferred) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50">
      <div className="rounded-2xl bg-white border border-ocean-200 shadow-[var(--shadow-tropical)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lagon-400 to-ocean-600 flex items-center justify-center text-white flex-shrink-0">
            <Download size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-ocean-900">Installer MooreaNews</p>
            <p className="text-xs text-ocean-600 mt-1">
              Accès rapide ferries, alertes et météo depuis votre écran d&apos;accueil.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await deferred.prompt();
                  setDeferred(null);
                }}
                className="px-3 py-1.5 rounded-full bg-lagon-600 text-white text-xs font-semibold"
              >
                Installer
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("pwa-install-dismissed", "1");
                  setHidden(true);
                }}
                className="px-3 py-1.5 rounded-full bg-ocean-100 text-ocean-700 text-xs font-semibold"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("pwa-install-dismissed", "1");
              setHidden(true);
            }}
            className="text-ocean-400 hover:text-ocean-700"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
