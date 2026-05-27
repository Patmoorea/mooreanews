"use client";

import { useState } from "react";
import { Link2, Check, AlertCircle } from "lucide-react";
import { addFacebookCommunityLink } from "@/app/admin/external-actions";

export function AddFacebookLinkForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await addFacebookCommunityLink(fd);
      setStatus("ok");
      setMessage("Lien enregistré — visible dans Actualités (veille externe).");
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-3 border-t border-ocean-100 pt-4"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-ocean-500">
        Ajouter un post Facebook (manuel)
      </p>
      <p className="text-xs text-ocean-600">
        Pour un nouveau permalink : collez l’URL ici ou ajoutez-la dans{" "}
        <code className="bg-ocean-100 px-1 rounded text-[10px]">
          FACEBOOK_WATCH_URLS
        </code>{" "}
        sur Vercel (relevé auto au prochain cron).
      </p>
      <input
        name="url"
        required
        type="url"
        placeholder="https://www.facebook.com/groups/…/permalink/…"
        className="w-full px-3 py-2 rounded-xl border border-ocean-200 text-sm"
      />
      <input
        name="title"
        required
        placeholder="Titre de la publication"
        className="w-full px-3 py-2 rounded-xl border border-ocean-200 text-sm"
      />
      <textarea
        name="excerpt"
        rows={3}
        placeholder="Résumé (optionnel)"
        className="w-full px-3 py-2 rounded-xl border border-ocean-200 text-sm"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-ocean-600 to-ocean-800 text-white text-sm font-semibold disabled:opacity-60"
      >
        <Link2 size={14} />
        {status === "loading" ? "Enregistrement…" : "Publier sur MooreaNews"}
      </button>
      {message && (
        <p
          className={`text-xs flex items-center gap-1.5 ${
            status === "error" ? "text-tiare-700" : "text-tipanier-700"
          }`}
        >
          {status === "error" ? (
            <AlertCircle size={12} />
          ) : (
            <Check size={12} />
          )}
          {message}
        </p>
      )}
    </form>
  );
}
