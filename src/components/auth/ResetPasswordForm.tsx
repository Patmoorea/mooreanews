"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Lock } from "lucide-react";
import { getBrowserSupabase, isSupabaseEnabled } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setError(null);

      if (!isSupabaseEnabled()) {
        if (!cancelled) setError("Supabase n'est pas configuré.");
        if (!cancelled) setLoading(false);
        return;
      }

      const supabase = getBrowserSupabase();
      if (!supabase) {
        if (!cancelled) setError("Supabase n'est pas configuré.");
        if (!cancelled) setLoading(false);
        return;
      }

      setLoading(true);
      if (cancelled) return;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError) {
        setError(userError.message);
        setReady(false);
        setLoading(false);
        return;
      }

      if (!user) {
        setError("Lien invalide ou expiré.");
        setReady(false);
        setLoading(false);
        return;
      }

      setReady(true);
      setLoading(false);
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-sm text-ocean-600">Chargement…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-tipanier-300 shadow-[var(--shadow-soft)] text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-tipanier-400 to-tipanier-600 text-white inline-flex items-center justify-center mb-4">
          <Check size={28} />
        </div>
        <h2 className="font-display text-xl text-ocean-950">
          Mot de passe mis à jour
        </h2>
        <p className="mt-2 text-sm text-ocean-700">
          Vous pouvez maintenant vous connecter.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-ocean-100 shadow-[var(--shadow-soft)] space-y-4"
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ocean-50 text-tiare-600 mb-3">
          <Lock size={20} />
        </div>
        <h2 className="font-display text-2xl text-ocean-950">
          Réinitialiser le mot de passe
        </h2>
        <p className="mt-2 text-sm text-ocean-700">
          Choisissez un nouveau mot de passe pour terminer.
        </p>
      </div>

      {!ready && (
        <div className="bg-tiare-50 border border-tiare-200 rounded-2xl p-4 text-sm text-tiare-700">
          {error ?? "Lien invalide ou expiré."}
        </div>
      )}

      {error && ready && (
        <p className="text-sm text-tiare-700 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      <label className="block">
        <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
          Nouveau mot de passe
        </span>
        <input
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={!ready || submitting}
          className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200 disabled:opacity-60"
          autoComplete="new-password"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
          Confirmer
        </span>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={!ready || submitting}
          className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200 disabled:opacity-60"
          autoComplete="new-password"
        />
      </label>

      <button
        type="submit"
        disabled={!ready || submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-600 text-white font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
      >
        {submitting ? "Mise à jour…" : "Mettre à jour"}
      </button>
    </form>
  );
}

