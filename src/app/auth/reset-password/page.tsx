import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — MooreaNews",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="bg-gradient-to-b from-ocean-50 via-lagon-50 to-white min-h-[70vh] py-16">
      <Container size="narrow">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl sm:text-4xl text-ocean-950">
              Mot de passe oublié ?
            </h1>
            <p className="mt-2 text-ocean-700 text-sm">
              Entrez un nouveau mot de passe pour terminer.
            </p>
          </div>

          {isSupabaseConfigured() ? (
            <ResetPasswordForm />
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-tiare-300 shadow-[var(--shadow-soft)] text-center">
              <p className="text-tiare-700 font-semibold">
                Fonctionnalité non disponible (Supabase non configuré).
              </p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

