"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Props = {
  redirectTo?: string;
  initialError?: string;
};

export function LoginForm({ redirectTo, initialError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(translateError(error.message));
      setLoading(false);
      return;
    }

    router.push(redirectTo || "/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-ocean-100 shadow-[var(--shadow-soft)] space-y-4"
    >
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
          placeholder="vous@email.com"
          autoComplete="email"
        />
      </label>

      <label className="block">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-sm font-semibold text-ocean-800">
            Mot de passe
          </span>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-tiare-600 hover:underline"
          >
            Oublié ?
          </Link>
        </div>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-sable-50 border border-ocean-200/50 rounded-xl text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200"
          autoComplete="current-password"
        />
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
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white font-semibold shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
      >
        {loading ? (
          "Connexion…"
        ) : (
          <>
            <LogIn size={18} />
            Se connecter
          </>
        )}
      </button>
    </form>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (msg.includes("Email not confirmed"))
    return "Veuillez confirmer votre email avant de vous connecter.";
  if (msg.includes("rate"))
    return "Trop de tentatives, réessayez dans quelques minutes.";
  return msg;
}
