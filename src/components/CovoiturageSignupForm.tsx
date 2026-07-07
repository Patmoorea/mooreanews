"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, UserPlus } from "lucide-react";
import { HoneypotField } from "@/components/ui/HoneypotField";

type Props = {
  announcementId: string;
  seatsLeft: number;
};

type Status = "idle" | "loading" | "success" | "error";

export function CovoiturageSignupForm({ announcementId, seatsLeft }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(seatsLeft);

  if (remaining <= 0) {
    return (
      <p className="mt-4 rounded-xl bg-ocean-50 px-4 py-3 text-sm font-medium text-ocean-700">
        Complet — plus de place sur ce trajet.
      </p>
    );
  }

  if (status === "success") {
    return (
      <div className="mt-4 rounded-xl border border-lagon-200 bg-lagon-50 px-4 py-3 text-sm text-lagon-900">
        <p className="flex items-center gap-2 font-semibold">
          <Check className="h-4 w-4" />
          Inscription enregistrée !
        </p>
        <p className="mt-1 text-lagon-800">{message}</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;

    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/covoiturage/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        detail?: string;
        message?: string;
        seatsLeft?: number;
      } | null;

      if (!res.ok || !json?.ok) {
        throw new Error(json?.detail ?? "Inscription impossible");
      }

      if (typeof json.seatsLeft === "number") {
        setRemaining(json.seatsLeft);
      }
      setMessage(
        json.message ??
          "Le conducteur a été prévenu et pourra vous contacter.",
      );
      setStatus("success");
      setOpen(false);
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Erreur réseau — réessayez.",
      );
    }
  }

  return (
    <div className="mt-4 border-t border-ocean-100 pt-4">
      <p className="text-xs text-ocean-500 mb-2">
        {remaining} place{remaining > 1 ? "s" : ""} restante
        {remaining > 1 ? "s" : ""}
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border-2 border-lagon-600 bg-white px-5 py-2.5 text-sm font-bold text-lagon-700 hover:bg-lagon-50 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          S&apos;inscrire à ce trajet
        </button>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-ocean-50/80 p-4">
          <HoneypotField />
          <input type="hidden" name="announcementId" value={announcementId} />
          <p className="text-sm font-semibold text-ocean-900">
            Je souhaite rejoindre ce trajet
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ocean-700">
              Votre nom *
            </span>
            <input
              name="name"
              required
              maxLength={80}
              className="form-input text-sm"
              placeholder="Prénom et nom"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ocean-700">
              Téléphone / WhatsApp *
            </span>
            <input
              name="phone"
              required
              type="tel"
              inputMode="tel"
              className="form-input text-sm"
              placeholder="87 12 34 56"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ocean-700">
              Message (optionnel)
            </span>
            <input
              name="message"
              maxLength={200}
              className="form-input text-sm"
              placeholder="Point de RDV souhaité, bagages…"
            />
          </label>
          <label className="flex items-start gap-2 text-xs text-ocean-600">
            <input type="checkbox" name="consent" required className="mt-0.5" />
            <span>
              J&apos;accepte que mes coordonnées soient transmises au conducteur.{" "}
              <Link href="/confidentialite" className="underline">
                Confidentialité
              </Link>
            </span>
          </label>
          {status === "error" && (
            <p className="text-xs text-coral-700 bg-coral-50 rounded-lg px-3 py-2">
              {message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center gap-2 rounded-full bg-lagon-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {status === "loading" ? "Envoi…" : "Confirmer mon inscription"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setStatus("idle");
                setMessage("");
              }}
              className="text-sm text-ocean-600 hover:underline px-2 py-2"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
