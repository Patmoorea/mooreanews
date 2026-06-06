"use client";

import { useState } from "react";
import { Mail, Send, Check, AlertCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";

type Status = "idle" | "loading" | "success" | "error";

/** CTA newsletter visible sur l’accueil — rétention visiteurs. */
export function HomeNewsletterBand() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
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
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !json?.ok) throw new Error("fail");
      setStatus("success");
      setMessage("Inscrit — brief matin dans votre boîte mail.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Échec — réessayez dans un instant.");
    }
  }

  return (
    <section
      id="newsletter"
      aria-labelledby="home-newsletter-title"
      className="border-y border-lagon-100 bg-gradient-to-r from-lagon-50 via-white to-soleil-50"
    >
      <Container className="py-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-lagon-700">
              <Mail size={14} aria-hidden />
              Gratuit · 1 email / jour
            </p>
            <h2
              id="home-newsletter-title"
              className="mt-2 font-display text-2xl sm:text-3xl text-ocean-950 text-balance"
            >
              Ne ratez rien à Moorea
            </h2>
            <p className="mt-2 text-sm sm:text-base text-ocean-600 text-pretty">
              Ferry, alertes coupures, agenda du week-end et temps fort de l’île —
              le brief matin MooreaNews.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="w-full lg:max-w-md shrink-0 flex flex-col sm:flex-row gap-2"
          >
            <label htmlFor="home-newsletter-email" className="sr-only">
              Votre email
            </label>
            <input
              id="home-newsletter-email"
              type="email"
              required
              autoComplete="email"
              placeholder="votre@email.pf"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="flex-1 rounded-xl border border-ocean-200 bg-white px-4 py-3 text-ocean-900 placeholder:text-ocean-400 focus:outline-none focus:ring-2 focus:ring-lagon-400"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lagon-500 to-ocean-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:-translate-y-0.5 transition-transform disabled:opacity-60"
            >
              {status === "loading" ? (
                "…"
              ) : status === "success" ? (
                <>
                  <Check size={16} /> OK
                </>
              ) : (
                <>
                  <Send size={16} /> S&apos;inscrire
                </>
              )}
            </button>
          </form>
        </div>
        {message ? (
          <p
            className={`mt-3 text-sm flex items-center gap-2 ${
              status === "error" ? "text-tiare-700" : "text-lagon-800"
            }`}
          >
            {status === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
            {message}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
