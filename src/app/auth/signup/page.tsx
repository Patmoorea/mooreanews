import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SignupForm } from "@/components/auth/SignupForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Créer un compte — MooreaNews",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <section className="bg-gradient-to-b from-tiare-50 via-soleil-50 to-white min-h-[70vh] py-16">
      <Container size="narrow">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl sm:text-4xl text-ocean-950">
              Rejoindre MooreaNews
            </h1>
            <p className="mt-2 text-ocean-700">
              Créez votre compte pour publier et suivre vos contributions
            </p>
          </div>

          {isSupabaseConfigured() ? (
            <SignupForm />
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-tiare-300">
              <p className="text-tiare-700 font-semibold">
                Inscription non disponible
              </p>
              <p className="mt-2 text-sm text-ocean-700">
                L&apos;administrateur doit d&apos;abord configurer Supabase.
              </p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-ocean-600">
            Déjà inscrit ?{" "}
            <Link
              href="/auth/login"
              className="text-tiare-600 font-semibold hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
