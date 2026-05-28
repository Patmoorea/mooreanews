"use client";

import { useState } from "react";
import { Send, Check, AlertCircle } from "lucide-react";
import { PosterUploadField } from "@/components/PosterUploadField";

type Status = "idle" | "loading" | "success" | "error";

const TYPES = [
  { value: "event", label: "Événement (concert, marché, fête…)" },
  { value: "annonce", label: "Annonce (vente, location, emploi…)" },
  { value: "service", label: "Service / commerce" },
  { value: "signalement", label: "Signalement" },
  { value: "suggestion", label: "Autre info" },
] as const;

const DISTRICTS = [
  "Afareaitu",
  "Haapiti",
  "Maatea",
  "Maharepa",
  "Papetoai",
  "Paopao",
  "Teavaro",
  "Temae",
  "Tiahura",
  "Vaiare",
  "Toute l'île",
];

const POSTER_TYPES = new Set(["event", "annonce"]);

export function SubmitForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [pubType, setPubType] = useState("event");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;

    const cover = data.cover_url?.trim() ?? "";
    if (POSTER_TYPES.has(data.type) && !cover) {
      setStatus("error");
      setMessage("Ajoutez d’abord votre affiche (bouton « choisir l’affiche »).");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, cover_url: cover }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        detail?: string;
        warnings?: string[];
      } | null;

      if (!res.ok || !json?.ok) {
        const detail =
          json?.detail ??
          (json?.error === "invalid_payload"
            ? "Vérifiez les champs du formulaire."
            : json?.error === "not_configured"
              ? "Service temporairement indisponible — écrivez-nous via Contact."
              : "Envoi impossible pour le moment.");
        throw new Error(detail);
      }
      setStatus("success");
      setMessage(
        "Merci ! Affiche reçue. Publication après validation (sous 24 h).",
      );
      form.reset();
      setPubType("event");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Erreur réseau. Réessayez ou contactez-nous.",
      );
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 bg-white rounded-3xl p-6 sm:p-8 border border-ocean-100 shadow-[var(--shadow-soft)]"
    >
      <Field label="Type" required>
        <select
          name="type"
          required
          className="form-input"
          value={pubType}
          onChange={(e) => setPubType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <PosterUploadField
        name="cover_url"
        uploadEndpoint="/api/submit/upload"
        label={
          POSTER_TYPES.has(pubType)
            ? "Votre affiche (photo du flyer)"
            : "Photo (si vous en avez une)"
        }
        help="Touchez pour choisir la photo depuis le téléphone. Max 5 Mo."
        required={POSTER_TYPES.has(pubType)}
      />

      <Field label="Titre" required>
        <input
          name="title"
          required
          maxLength={120}
          className="form-input"
          placeholder="Ex. Dépistage cancer de la peau"
        />
      </Field>

      <Field
        label={
          POSTER_TYPES.has(pubType)
            ? "Texte complémentaire (optionnel si tout est sur l’affiche)"
            : "Description"
        }
        required={!POSTER_TYPES.has(pubType)}
      >
        <textarea
          name="description"
          required={!POSTER_TYPES.has(pubType)}
          rows={4}
          maxLength={1500}
          className="form-input"
          placeholder="Date, heure, lieu, contact…"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Date">
          <input name="date" type="date" className="form-input" />
        </Field>
        <Field label="Heure">
          <input name="time" type="time" className="form-input" />
        </Field>
      </div>

      <Field label="Lieu">
        <input
          name="location"
          className="form-input"
          placeholder="Ex. Hôpital de Moorea"
        />
      </Field>

      <Field label="District">
        <select name="district" className="form-input" defaultValue="">
          <option value="">— Choisir —</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Votre nom" required>
          <input name="name" required className="form-input" />
        </Field>
        <Field label="Téléphone ou email" required>
          <input name="contact" required className="form-input" />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-sm text-ocean-700">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 w-4 h-4 rounded border-ocean-300 text-tiare-500"
        />
        <span>
          J&apos;accepte la relecture avant publication et l&apos;affichage de
          mes coordonnées.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
      >
        {status === "loading" ? (
          "Envoi…"
        ) : status === "success" ? (
          <>
            <Check size={18} /> Envoyé
          </>
        ) : (
          <>
            <Send size={18} /> Envoyer l&apos;affiche
          </>
        )}
      </button>

      {message ? (
        <p
          className={`text-sm flex items-center gap-2 rounded-lg p-3 ${
            status === "success"
              ? "text-tipanier-800 bg-tipanier-50"
              : "text-tiare-800 bg-tiare-50"
          }`}
        >
          {status === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
          {message}
        </p>
      ) : null}

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #fefdf8;
          border: 1px solid rgb(14 165 233 / 0.18);
          border-radius: 0.75rem;
          color: #0c4a6e;
          font-size: 0.95rem;
        }
        :global(.form-input:focus) {
          outline: none;
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgb(6 182 212 / 0.15);
        }
      `}</style>
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
      <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
        {label}
        {required && <span className="text-tiare-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
