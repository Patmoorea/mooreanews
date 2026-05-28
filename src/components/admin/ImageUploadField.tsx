"use client";

import { useState } from "react";
import { ImagePlus, Loader2, AlertCircle } from "lucide-react";

type Props = {
  name?: string;
  label?: string;
  defaultValue?: string | null;
  help?: string;
};

export function ImageUploadField({
  name = "cover_url",
  label = "Image / affiche",
  defaultValue,
  help = "JPEG, PNG, WebP ou GIF — max 5 Mo. Vous pouvez aussi coller une URL plus bas.",
}: Props) {
  const [url, setUrl] = useState(defaultValue?.trim() ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        url?: string;
        detail?: string;
        error?: string;
      } | null;

      if (!res.ok || !json?.ok || !json.url) {
        throw new Error(
          json?.detail ??
            (json?.error === "file_too_large"
              ? "Fichier trop lourd (max 5 Mo)."
              : "Échec du téléversement. Vérifiez Supabase Storage (bucket media)."),
        );
      }
      setUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-ocean-800">{label}</span>

      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative rounded-xl overflow-hidden border border-ocean-200 bg-ocean-50 max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Aperçu"
            className="w-full h-auto max-h-64 object-contain"
          />
        </div>
      ) : null}

      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-lagon-400 bg-lagon-50 text-sm font-medium text-ocean-800 cursor-pointer hover:bg-lagon-100 transition-colors">
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-lagon-600" />
        ) : (
          <ImagePlus size={18} className="text-lagon-600" />
        )}
        {uploading ? "Envoi en cours…" : "Choisir une image depuis l’ordinateur"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={uploading}
          onChange={onPick}
        />
      </label>

      <label className="block">
        <span className="block text-xs text-ocean-600 mb-1">
          Ou URL de l’image (Facebook, site ICPF…)
        </span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="w-full px-3 py-2 bg-white border border-ocean-200 rounded-lg text-sm text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
        />
      </label>

      {help ? <p className="text-xs text-ocean-500">{help}</p> : null}

      {error ? (
        <p className="text-sm text-tiare-700 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
