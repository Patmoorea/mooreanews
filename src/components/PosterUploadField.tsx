"use client";

import { useState } from "react";
import { ImagePlus, Loader2, AlertCircle, Check } from "lucide-react";

type Props = {
  name?: string;
  label?: string;
  defaultValue?: string | null;
  help?: string;
  uploadEndpoint?: string;
  required?: boolean;
};

/**
 * Téléverse une affiche puis remplit un champ caché (URL) pour le formulaire.
 */
export function PosterUploadField({
  name = "cover_url",
  label = "Affiche / photo",
  defaultValue,
  help = "JPEG, PNG, WebP ou GIF — max 5 Mo.",
  uploadEndpoint = "/api/admin/upload",
  required = false,
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
      const res = await fetch(uploadEndpoint, {
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
        const msg =
          json?.detail ??
          (json?.error === "bucket_missing"
            ? "Stockage Supabase : bucket « media » introuvable. Réessayez dans 1 min (création auto) ou exécutez supabase/storage-media.sql dans Supabase → SQL Editor."
            : json?.error === "storage_not_configured"
              ? "Stockage images non configuré sur le serveur (SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel)."
              : json?.error === "file_too_large"
                ? "Fichier trop lourd (max 5 Mo)."
                : "Échec de l’envoi de l’image. Réessayez ou collez une URL ci-dessous.");
        throw new Error(msg);
      }
      setUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setUploading(false);
    }
  }

  const ready = !!url.trim();

  return (
    <div className="space-y-3 rounded-2xl border-2 border-dashed border-lagon-300 bg-lagon-50/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="block text-sm font-semibold text-ocean-900">
          {label}
          {required ? <span className="text-tiare-500 ml-0.5">*</span> : null}
        </span>
        {ready ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-tipanier-700 bg-tipanier-100 px-2 py-1 rounded-full">
            <Check size={12} />
            Image prête
          </span>
        ) : null}
      </div>

      <input type="hidden" name={name} value={url} />

      {ready ? (
        <div className="mx-auto max-w-xs rounded-xl overflow-hidden border border-ocean-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Aperçu de l’affiche"
            className="w-full h-auto max-h-72 object-contain"
          />
        </div>
      ) : null}

      <label className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full py-4 px-4 rounded-xl bg-white border border-lagon-400 text-sm font-semibold text-ocean-900 cursor-pointer hover:bg-lagon-50 transition-colors">
        {uploading ? (
          <Loader2 size={22} className="animate-spin text-lagon-600" />
        ) : (
          <ImagePlus size={22} className="text-lagon-600" />
        )}
        <span>
          {uploading
            ? "Envoi de l’affiche…"
            : ready
              ? "Changer l’affiche"
              : "Appuyer pour choisir l’affiche (photo)"}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/*"
          className="sr-only"
          disabled={uploading}
          onChange={onPick}
        />
      </label>

      <label className="block">
        <span className="block text-xs text-ocean-600 mb-1">
          Ou coller le lien de l’image (Facebook, etc.)
        </span>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setError("");
            setUrl(e.target.value);
          }}
          placeholder="https://…"
          className="w-full px-3 py-2.5 bg-white border border-ocean-200 rounded-lg text-sm text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
        />
      </label>

      {help ? <p className="text-xs text-ocean-600">{help}</p> : null}

      {error ? (
        <p className="text-sm text-tiare-800 flex items-start gap-2 bg-tiare-50 border border-tiare-200 rounded-lg p-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
