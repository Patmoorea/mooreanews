"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Send, AlertCircle, Loader2 } from "lucide-react";

type SubmitType = "event" | "announcement" | "restaurant" | "activity";

export function SubmitForm() {
  const t = useTranslations("submit.form");
  const tSuccess = useTranslations("submit.success");

  const [type, setType] = useState<SubmitType>("event");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const typeLabels: Record<SubmitType, string> = {
    event: t("typeEvent"),
    announcement: t("typeAnnouncement"),
    restaurant: t("typeRestaurant"),
    activity: t("typeActivity"),
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const payload = {
      type,
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      date: String(fd.get("date") ?? ""),
      location: String(fd.get("location") ?? ""),
      category: String(fd.get("category") ?? ""),
      contactName: String(fd.get("contactName") ?? ""),
      contactPhone: String(fd.get("contactPhone") ?? ""),
      contactEmail: String(fd.get("contactEmail") ?? ""),
      consent: fd.get("consent") === "on",
    };

    setStatus("loading");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12 px-6 bg-gradient-to-br from-palm-50 to-lagoon-50 rounded-2xl border border-palm-200">
        <div className="h-16 w-16 rounded-full bg-palm-500 mx-auto mb-4 flex items-center justify-center text-white">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="font-display text-2xl text-deep-900 mb-2">
          {tSuccess("title")}
        </h3>
        <p className="text-muted max-w-md mx-auto">{tSuccess("body")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-deep-900 mb-3">
          {t("type")}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.keys(typeLabels) as SubmitType[]).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setType(k)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                type === k
                  ? "bg-gradient-to-r from-hibiscus-500 to-sunset-500 text-white shadow-lg"
                  : "bg-white border border-lagoon-200 text-deep-900 hover:border-lagoon-400"
              }`}
            >
              {typeLabels[k]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-deep-900 mb-1.5">
          {t("title")} *
        </label>
        <input
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={150}
          className="w-full rounded-xl border border-lagoon-200 px-4 py-2.5 focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-100 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-deep-900 mb-1.5">
          {t("description")} *
        </label>
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className="w-full rounded-xl border border-lagoon-200 px-4 py-2.5 focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-100 focus:outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {type === "event" && (
          <div>
            <label className="block text-sm font-semibold text-deep-900 mb-1.5">
              {t("date")}
            </label>
            <input
              name="date"
              type="date"
              className="w-full rounded-xl border border-lagoon-200 px-4 py-2.5 focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-100 focus:outline-none transition-colors"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-deep-900 mb-1.5">
            {t("location")} *
          </label>
          <input
            name="location"
            type="text"
            required
            placeholder="Maharepa, Pao Pao, Haapiti…"
            className="w-full rounded-xl border border-lagoon-200 px-4 py-2.5 focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-100 focus:outline-none transition-colors"
          />
        </div>
        <div className={type === "event" ? "" : "md:col-span-2"}>
          <label className="block text-sm font-semibold text-deep-900 mb-1.5">
            {t("category")}
          </label>
          <input
            name="category"
            type="text"
            className="w-full rounded-xl border border-lagoon-200 px-4 py-2.5 focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-100 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-lagoon-100">
        <h3 className="font-semibold text-deep-900 mb-4">{t("contact")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-deep-900 mb-1.5">
              {t("name")} *
            </label>
            <input
              name="contactName"
              type="text"
              required
              className="w-full rounded-xl border border-lagoon-200 px-4 py-2.5 focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-100 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-deep-900 mb-1.5">
              {t("email")} *
            </label>
            <input
              name="contactEmail"
              type="email"
              required
              className="w-full rounded-xl border border-lagoon-200 px-4 py-2.5 focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-100 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-deep-900 mb-1.5">
              {t("phone")}
            </label>
            <input
              name="contactPhone"
              type="tel"
              className="w-full rounded-xl border border-lagoon-200 px-4 py-2.5 focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-100 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-sand-50 border border-sand-200">
        <input
          name="consent"
          type="checkbox"
          required
          id="consent"
          className="mt-1"
        />
        <label htmlFor="consent" className="text-sm text-deep-800">
          {t("consent")}
        </label>
      </div>

      {status === "error" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-hibiscus-50 border border-hibiscus-200 text-hibiscus-900">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            Une erreur est survenue. Merci de réessayer ou de nous contacter
            directement.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-hibiscus-500 to-sunset-500 px-6 py-3.5 font-semibold text-white shadow-lg hover:shadow-2xl disabled:opacity-60 transition-all"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t("submit")}
          </>
        )}
      </button>
    </form>
  );
}
