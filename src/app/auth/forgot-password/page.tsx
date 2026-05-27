import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mot de passe oublié — MooreaNews",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <section className="bg-gradient-to-b from-ocean-50 via-lagon-50 to-white min-h-[70vh] py-16">
      <Container size="narrow">
        <div className="max-w-md mx-auto">
          <h1 className="font-display text-3xl text-ocean-950 text-center">
            Mot de passe oublié ?
          </h1>
          <p className="mt-2 text-center text-ocean-700">
            Entrez votre email, nous vous enverrons un lien de
            réinitialisation.
          </p>
          <div className="mt-8">
            {isSupabaseConfigured() ? (
              <ForgotPasswordForm />
            ) : (
              <p className="text-center text-tiare-700">
                Fonctionnalité non disponible (Supabase non configuré).
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
