"use client";

import { useState } from "react";
import { Send, Check, AlertCircle } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; warnings?: string[] }
        | null;
      if (!res.ok || !json?.ok) throw new Error("Échec");
      setStatus("success");
      setMessage(
        "Inscription confirmée ! Bienvenue à bord du lagon. 🌺"
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(
        "Désolé, nous n'avons pas pu vous inscrire. Réessayez plus tard."
      );
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20"
    >
      <label
        htmlFor="newsletter-email"
        className="text-xs uppercase tracking-widest text-ocean-200 font-medium block mb-2"
      >
        Inscription gratuite
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 h-12 px-4 rounded-full bg-white text-ocean-950 placeholder:text-ocean-400 focus:outline-none focus:ring-2 focus:ring-lagon-300"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-12 px-6 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white font-semibold inline-flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform disabled:opacity-60"
        >
          {status === "loading" ? (
            "Inscription…"
          ) : status === "success" ? (
            <>
              <Check size={18} />
              Inscrit !
            </>
          ) : (
            <>
              <Send size={16} />
              S&apos;inscrire
            </>
          )}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm flex items-center gap-2 ${
            status === "success" ? "text-tipanier-300" : "text-tiare-200"
          }`}
        >
          {status === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
          {message}
        </p>
      )}
      <p className="mt-2 text-[11px] text-ocean-200/60">
        1 email par semaine, désinscription en 1 clic.
      </p>
    </form>
  );
}
