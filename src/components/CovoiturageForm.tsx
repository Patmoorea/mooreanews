"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Check, Send, Share2 } from "lucide-react";
import { HoneypotField } from "@/components/ui/HoneypotField";
import {
  CARPOOL_DIRECTIONS,
  CARPOOL_MEETING_POINTS,
  facebookShareUrl,
  whatsAppShareUrl,
  type CarpoolDirection,
} from "@/lib/covoiturage";
import { SOCIAL, MOOREA_COMMUNITY_LINKS } from "@/lib/constants";

type Status = "idle" | "loading" | "success" | "error";

const FB_GROUP =
  MOOREA_COMMUNITY_LINKS.find((l) => l.href.includes("/groups/"))?.href ??
  SOCIAL.facebook;

export function CovoiturageForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [direction, setDirection] =
    useState<CarpoolDirection>("vers-quai");
  const [successTitle, setSuccessTitle] = useState("");

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });

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
      const res = await fetch("/api/covoiturage/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          seats: Number(data.seats) || 1,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        detail?: string;
        title?: string;
        pageUrl?: string;
      } | null;

      if (!res.ok || !json?.ok) {
        throw new Error(json?.detail ?? json?.error ?? "Envoi impossible");
      }

      setSuccessTitle(json.title ?? "Trajet publié");
      setStatus("success");
      form.reset();
      setDirection("vers-quai");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Erreur réseau — réessayez.",
      );
    }
  }

  if (status === "success") {
    const shareText = `🚗 Covoiturage voiture Moorea (quai Vaiare) : ${successTitle}\nTous les trajets sur MooreaNews :\nhttps://www.mooreanews.com/covoiturage`;
    return (
      <div className="rounded-3xl border border-lagon-200 bg-gradient-to-b from-lagon-50 to-white p-6 sm:p-8 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3 text-lagon-800">
          <Check className="h-8 w-8 shrink-0" />
          <div>
            <h3 className="font-display text-xl font-bold text-ocean-900">
              Trajet publié !
            </h3>
            <p className="text-sm text-ocean-700 mt-1">
              Visible tout de suite sur cette page. Les intéressés vous
              contacteront par téléphone.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-ocean-900">{successTitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={whatsAppShareUrl(shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            <Share2 className="h-4 w-4" />
            Partager WhatsApp
          </a>
          <a
            href={facebookShareUrl("https://www.mooreanews.com/covoiturage")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            <Share2 className="h-4 w-4" />
            Partager Facebook
          </a>
          <a
            href={FB_GROUP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-ocean-200 bg-white px-4 py-2.5 text-sm font-semibold text-ocean-800"
          >
            Groupe Facebook Moorea
          </a>
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-medium text-tiare-600 hover:underline"
        >
          + Proposer un autre trajet
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-3xl border border-ocean-100 bg-white p-6 sm:p-8 shadow-[var(--shadow-soft)]"
    >
      <HoneypotField />
      <div className="flex items-center gap-2 text-ocean-800">
        <Car className="h-5 w-5 text-lagon-600" />
        <h3 className="font-display text-lg font-bold">Proposer un trajet</h3>
      </div>
      <p className="text-sm text-ocean-600 -mt-2">
        Covoiturage <strong>en voiture</strong> pour aller au quai Vaiare (ou en
        revenir) — pas le ferry. Sans compte · publication immédiate.
      </p>

      <Field label="Trajet en voiture" required>
        <select
          name="direction"
          required
          className="form-input"
          value={direction}
          onChange={(e) => setDirection(e.target.value as CarpoolDirection)}
        >
          {CARPOOL_DIRECTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date du trajet" required>
          <input
            type="date"
            name="tripDate"
            required
            min={today}
            className="form-input"
          />
        </Field>
        <Field label="Heure de départ" required>
          <input
            type="time"
            name="time"
            required
            className="form-input"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Départ (prise en charge)" required>
          <select name="meetingPoint" required className="form-input" defaultValue="">
            <option value="" disabled>
              Choisir…
            </option>
            {CARPOOL_MEETING_POINTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Arrivée" required>
          <input
            name="destination"
            required
            maxLength={120}
            placeholder={
              direction === "vers-quai"
                ? "Ex. Quai Vaiare, parking ferry"
                : "Ex. Maharepa, Afareaitu, Paopao…"
            }
            className="form-input"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Places disponibles" required>
          <input
            type="number"
            name="seats"
            min={1}
            max={8}
            defaultValue={3}
            required
            className="form-input"
          />
        </Field>
        <Field label="Partage frais (optionnel)">
          <input
            name="priceShare"
            maxLength={80}
            placeholder="Ex. 500 XPF, gratuit"
            className="form-input"
          />
        </Field>
      </div>

      <Field label="Précisions (optionnel)">
        <textarea
          name="notes"
          rows={2}
          maxLength={400}
          placeholder="Bagages, arrêt en route, retour prévu…"
          className="form-input resize-y min-h-[4rem]"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Votre prénom" required>
          <input name="author" required maxLength={80} className="form-input" />
        </Field>
        <Field label="Téléphone / WhatsApp" required>
          <input
            name="phone"
            required
            type="tel"
            inputMode="tel"
            placeholder="87 12 34 56"
            className="form-input"
          />
        </Field>
      </div>

      <label className="flex items-start gap-2 text-xs text-ocean-600">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        <span>
          J&apos;accepte que mon numéro soit affiché publiquement pour permettre
          le covoiturage.{" "}
          <Link href="/confidentialite" className="underline">
            Confidentialité
          </Link>
        </span>
      </label>

      {status === "error" && (
        <p className="text-sm text-coral-700 bg-coral-50 rounded-xl px-4 py-3">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-lagon-600 to-ocean-700 px-6 py-3.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {status === "loading" ? "Publication…" : "Publier mon trajet"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ocean-800">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
