"use client";

import { useState } from "react";
import { Send, Check, AlertCircle } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; warnings?: string[] }
        | null;
      if (!res.ok || !json?.ok) throw new Error("Erreur");
      setStatus("success");
      setMessage("Merci ! Votre message a bien été envoyé. Nous répondons sous 24h.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage(
        "Une erreur est survenue. Réessayez ou écrivez à postmaster@mooreanews.com."
      );
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 bg-white rounded-3xl p-6 sm:p-8 border border-ocean-100 shadow-[var(--shadow-soft)]"
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <label className="block">
          <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
            Nom <span className="text-tiare-500">*</span>
          </span>
          <input
            name="name"
            required
            className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
            placeholder="Prénom Nom"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
            Email <span className="text-tiare-500">*</span>
          </span>
          <input
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
            placeholder="vous@email.com"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
          Sujet
        </span>
        <input
          name="subject"
          className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
          placeholder="De quoi souhaitez-vous nous parler ?"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
          Message <span className="text-tiare-500">*</span>
        </span>
        <textarea
          name="message"
          required
          rows={6}
          maxLength={2000}
          className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
          placeholder="Votre message…"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white font-semibold shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
      >
        {status === "loading" ? (
          "Envoi…"
        ) : status === "success" ? (
          <>
            <Check size={18} />
            Envoyé
          </>
        ) : (
          <>
            <Send size={18} />
            Envoyer le message
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
    </form>
  );
}
