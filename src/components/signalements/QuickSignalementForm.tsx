"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Send, Check } from "lucide-react";
import { MOOREA_DISTRICTS } from "@/lib/constants";
import {
  SIGNALEMENT_CATEGORIES,
  getSignalementCategory,
  signalementCategoryRequiresPhoto,
} from "@/lib/signalement-categories";
import { PosterUploadField } from "@/components/PosterUploadField";

export function QuickSignalementForm() {
  const [category, setCategory] = useState<string>("route");
  const [district, setDistrict] = useState<string>("Toute l'île");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cat = getSignalementCategory(category);
  const photoRequired = signalementCategoryRequiresPhoto(category);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (photoRequired && !coverUrl.trim()) {
      setError("Une photo est obligatoire pour cette catégorie.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/signalement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category,
          description: description.trim(),
          location: location.trim() || undefined,
          district,
          name: name.trim() || "Anonyme",
          contact: email.trim(),
          coverUrl: coverUrl.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        const msg =
          json.error === "missing_photo"
            ? "Ajoutez une photo pour cette catégorie."
            : json.error === "description_too_short"
              ? "Description trop courte (min. 5 caractères)."
              : (json.error ?? "Échec envoi");
        throw new Error(msg);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-tipanier-200 bg-tipanier-50 p-6 text-center">
        <Check className="mx-auto text-tipanier-600 mb-2" size={28} />
        <p className="font-semibold text-ocean-900">Signalement reçu</p>
        <p className="text-sm text-ocean-600 mt-2">
          Modération MooreaNews — si validé, une alerte pourra être publiée (push quartier).
        </p>
        <Link href="/alertes" className="mt-4 inline-block text-sm text-lagon-700 font-semibold hover:underline">
          Voir les alertes →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8">
      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-2">Type</label>
        <div className="flex flex-wrap gap-2">
          {SIGNALEMENT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`text-xs px-3 py-2 rounded-full font-semibold ${
                category === c.id
                  ? "bg-tiare-600 text-white"
                  : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ocean-800 mb-1">Détails *</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Soyez factuel : quoi, où, quand, source si possible."
          className="w-full rounded-xl border border-ocean-200 px-4 py-3 text-sm"
        />
      </div>

      <PosterUploadField
        label={photoRequired ? "Photo *" : "Photo (recommandée)"}
        help="JPEG, PNG, WebP ou GIF — max 5 Mo."
        uploadEndpoint="/api/submit/upload"
        required={photoRequired}
        onChange={setCoverUrl}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ocean-800 mb-1">Lieu</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm"
            placeholder="PK, quartier, plage…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ocean-800 mb-1">Quartier</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm"
          >
            {[...MOOREA_DISTRICTS, "Toute l'île"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ocean-800 mb-1">Votre nom</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ocean-800 mb-1">Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl bg-lagon-50 border border-lagon-200 p-4 text-sm text-ocean-700">
        <p className="font-semibold text-ocean-900 mb-1">Via Telegram</p>
        <p>
          Ouvrez Telegram et tapez <strong>/start</strong> au bot MooreaNews configuré pour
          envoyer accident, baleines, incendie ou météo avec photo.
        </p>
      </div>

      {error && <p className="text-sm text-tiare-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-tiare-500 to-tiare-700 text-white font-semibold disabled:opacity-60"
      >
        <Send size={16} />
        {loading ? "Envoi…" : "Envoyer le signalement"}
      </button>
      <p className="text-xs text-ocean-500 flex items-start gap-2">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        {cat.label} — vérification humaine avant publication. Urgence vitale : 15 ou secours.
      </p>
    </form>
  );
}
