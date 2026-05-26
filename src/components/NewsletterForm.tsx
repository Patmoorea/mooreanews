"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, Send, Check } from "lucide-react";

export function NewsletterForm() {
  const t = useTranslations("sections.newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-lagoon-700 via-deep-800 to-lagoon-900 text-white">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <Mail className="h-10 w-10 mx-auto mb-4 text-hibiscus-300" />
        <h2 className="font-display text-3xl sm:text-4xl mb-3">{t("title")}</h2>
        <p className="text-white/80 mb-8 max-w-xl mx-auto">{t("subtitle")}</p>

        <form
          onSubmit={onSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder")}
            required
            disabled={status === "loading" || status === "success"}
            className="flex-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 px-5 py-3 placeholder:text-white/50 text-white focus:bg-white/20 focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-hibiscus-500 to-sunset-500 px-6 py-3 font-semibold shadow-xl hover:shadow-2xl disabled:opacity-60 transition-all"
          >
            {status === "success" ? (
              <>
                <Check className="h-4 w-4" />
                OK
              </>
            ) : (
              <>
                {t("subscribe")}
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {status === "success" && (
          <p className="text-palm-300 text-sm mt-4">{t("success")}</p>
        )}
        {status === "error" && (
          <p className="text-hibiscus-300 text-sm mt-4">{t("error")}</p>
        )}

        <p className="text-xs text-white/50 mt-6 max-w-md mx-auto">
          {t("consent")}
        </p>
      </div>
    </section>
  );
}
