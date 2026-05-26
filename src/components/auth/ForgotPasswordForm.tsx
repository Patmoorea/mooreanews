"use client";

import { useState } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/reset-password`
          : undefined,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent)
    return (
      <div className="bg-white rounded-3xl p-6 border border-tipanier-300 text-center">
        <Check className="mx-auto text-tipanier-600 mb-2" size={36} />
        <p className="text-ocean-800 font-semibold">Email envoyé !</p>
        <p className="text-sm text-ocean-600 mt-1">
          Vérifiez votre boîte de réception.
        </p>
      </div>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-ocean-100 shadow-[var(--shadow-soft)] space-y-4"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@email.com"
        className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
      />
      {error && (
        <p className="text-sm text-tiare-700 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white font-semibold disabled:opacity-60"
      >
        <Mail size={18} />
        {loading ? "Envoi…" : "Envoyer le lien"}
      </button>
    </form>
  );
}
