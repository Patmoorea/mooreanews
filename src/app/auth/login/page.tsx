import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { redirect, error } = await searchParams;

  return (
    <section className="bg-gradient-to-b from-lagon-50 via-ocean-50 to-white min-h-[70vh] py-16">
      <Container size="narrow">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl sm:text-4xl text-ocean-950">
              Ia ora na !
            </h1>
            <p className="mt-2 text-ocean-700">
              Connectez-vous à votre espace Moorea Hub
            </p>
          </div>

          {!isSupabaseConfigured() ? (
            <SupabaseNotConfigured />
          ) : (
            <LoginForm redirectTo={redirect} initialError={error} />
          )}

          <p className="mt-6 text-center text-sm text-ocean-600">
            Pas encore de compte ?{" "}
            <Link
              href="/auth/signup"
              className="text-tiare-600 font-semibold hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

function SupabaseNotConfigured() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-tiare-300 shadow-[var(--shadow-soft)]">
      <p className="text-tiare-700 font-semibold">
        Authentification non configurée
      </p>
      <p className="mt-2 text-sm text-ocean-700">
        L&apos;administrateur doit configurer les variables d&apos;environnement
        Supabase :
      </p>
      <ul className="mt-2 text-xs text-ocean-600 font-mono space-y-1">
        <li>NEXT_PUBLIC_SUPABASE_URL</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        <li>SUPABASE_SERVICE_ROLE_KEY</li>
      </ul>
      <p className="mt-3 text-xs text-ocean-500">
        Voir le fichier <code>README.md</code> pour la procédure d&apos;activation.
      </p>
    </div>
  );
}
