"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function CommercantForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const business = String(fd.get("business") ?? "").trim();
    const email = String(fd.get("contact") ?? "").trim();
    const details = String(fd.get("details") ?? "").trim();

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service",
          title: `Espace commerçant — ${business}`,
          name: business,
          contact: email,
          description: details || "Demande espace commerçant MooreaNews",
          consent: true,
        }),
      });
      if (!res.ok) throw new Error("fail");
      setStatus("ok");
      setMessage("Demande envoyée — nous vous recontactons sous 48h.");
      e.currentTarget.reset();
    } catch {
      setStatus("err");
      setMessage("Envoi impossible. Réessayez ou contactez-nous.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white border border-ocean-100 p-6">
      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-1">
          Nom du commerce *
        </label>
        <input
          name="business"
          required
          placeholder="Restaurant / activité / boutique…"
          className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-1">
          Email *
        </label>
        <input
          name="contact"
          type="email"
          required
          placeholder="contact@moncommerce.pf"
          className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-1">
          Menu du jour / infos à publier
        </label>
        <textarea
          name="details"
          rows={4}
          placeholder="Plat du jour, horaires exceptionnels, promo…"
          className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ocean-800 text-white text-sm font-semibold disabled:opacity-60"
      >
        <Send size={16} />
        Envoyer ma demande
      </button>
      {message && (
        <p
          className={`text-sm ${status === "ok" ? "text-tipanier-700" : "text-tiare-600"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
