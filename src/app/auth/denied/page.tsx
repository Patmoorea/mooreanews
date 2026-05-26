import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Accès refusé",
  robots: { index: false, follow: false },
};

export default function DeniedPage() {
  return (
    <section className="bg-gradient-to-b from-tiare-50 to-white min-h-[60vh] flex items-center">
      <Container size="narrow" className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-tiare-100 text-tiare-600 inline-flex items-center justify-center mb-4">
          <ShieldAlert size={28} />
        </div>
        <h1 className="font-display text-3xl text-ocean-950">Accès refusé</h1>
        <p className="mt-3 text-ocean-700 max-w-md mx-auto">
          Cette zone est réservée aux administrateurs et éditeurs. Si vous
          pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez
          l&apos;équipe.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white font-semibold"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-full bg-white border border-ocean-200 text-ocean-800 font-semibold hover:border-tiare-400"
          >
            Contacter l&apos;équipe
          </Link>
        </div>
      </Container>
    </section>
  );
}
