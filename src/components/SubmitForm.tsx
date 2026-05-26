"use client";

import { useState } from "react";
import { Send, Check, AlertCircle } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

const TYPES = [
  { value: "evenement", label: "Événement (concert, marché, fête…)" },
  { value: "annonce", label: "Annonce (vente, location, emploi…)" },
  { value: "service", label: "Service / commerce" },
  { value: "info", label: "Info pratique / brève" },
  { value: "autre", label: "Autre" },
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

export function SubmitForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur");
      setStatus("success");
      setMessage(
        "Merci ! Votre publication a bien été envoyée. Validation sous 24h."
      );
      form.reset();
    } catch {
      setStatus("error");
      setMessage(
        "Une erreur est survenue. Réessayez ou contactez-nous par email."
      );
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 bg-white rounded-3xl p-6 sm:p-8 border border-ocean-100 shadow-[var(--shadow-soft)]"
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Type de publication" required>
          <select
            name="type"
            required
            className="form-input"
            defaultValue=""
          >
            <option value="" disabled>
              Sélectionner…
            </option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
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
      </div>

      <Field label="Titre" required>
        <input
          name="title"
          required
          maxLength={120}
          className="form-input"
          placeholder="Ex: Concert au coucher de soleil"
        />
      </Field>

      <Field label="Description" required>
        <textarea
          name="description"
          required
          rows={5}
          maxLength={1500}
          className="form-input"
          placeholder="Détails de votre annonce : date, heure, lieu, prix, contact…"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Date (si événement)">
          <input
            name="date"
            type="date"
            className="form-input"
          />
        </Field>
        <Field label="Heure">
          <input
            name="time"
            type="time"
            className="form-input"
          />
        </Field>
      </div>

      <Field label="Lieu / adresse">
        <input
          name="location"
          className="form-input"
          placeholder="Ex: Débarcadère de Pao Pao"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Votre nom" required>
          <input
            name="name"
            required
            className="form-input"
            placeholder="Prénom Nom"
          />
        </Field>
        <Field label="Téléphone / Email" required>
          <input
            name="contact"
            required
            className="form-input"
            placeholder="87 12 34 56 ou vous@email.com"
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-sm text-ocean-700">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 w-4 h-4 rounded border-ocean-300 text-tiare-500 focus:ring-tiare-400"
        />
        <span>
          J&apos;accepte que ma publication soit relue par l&apos;équipe avant
          mise en ligne et que mon nom et mes coordonnées soient affichés sur
          le site.
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
            <Check size={18} />
            Publication envoyée
          </>
        ) : (
          <>
            <Send size={18} />
            Envoyer ma publication
          </>
        )}
      </button>

      {message && (
        <p
          className={`text-sm flex items-center gap-2 ${
            status === "success" ? "text-tipanier-700" : "text-tiare-700"
          }`}
        >
          {status === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
          {message}
        </p>
      )}

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #fefdf8;
          border: 1px solid rgb(14 165 233 / 0.18);
          border-radius: 0.75rem;
          color: #0c4a6e;
          font-size: 0.95rem;
          transition: border-color 0.2s;
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
