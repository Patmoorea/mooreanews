"use client";

import { useState } from "react";
import { UserPlus, AlertCircle, Check } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=/admin`
            : undefined,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-tipanier-300 shadow-[var(--shadow-soft)] text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-tipanier-400 to-tipanier-600 text-white inline-flex items-center justify-center mb-4">
          <Check size={28} />
        </div>
        <h2 className="font-display text-xl text-ocean-950">
          Vérifiez votre email
        </h2>
        <p className="mt-2 text-sm text-ocean-700">
          Un lien de confirmation a été envoyé à <strong>{email}</strong>.
          Cliquez dessus pour activer votre compte.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-ocean-100 shadow-[var(--shadow-soft)] space-y-4"
    >
      <label className="block">
        <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
          Nom complet
        </span>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
          placeholder="Prénom Nom"
          autoComplete="name"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
          autoComplete="email"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-semibold text-ocean-800 mb-1.5">
          Mot de passe
        </span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
          autoComplete="new-password"
        />
        <span className="block mt-1 text-xs text-ocean-500">
          Au moins 6 caractères
        </span>
      </label>

      {error && (
        <p className="text-sm text-tiare-700 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-600 text-white font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
      >
        {loading ? (
          "Création…"
        ) : (
          <>
            <UserPlus size={18} />
            Créer mon compte
          </>
        )}
      </button>

      <p className="text-xs text-ocean-500 text-center">
        En créant un compte vous acceptez nos{" "}
        <a href="/mentions-legales" className="underline">
          mentions légales
        </a>{" "}
        et notre{" "}
        <a href="/confidentialite" className="underline">
          politique de confidentialité
        </a>
        .
      </p>
    </form>
  );
}
