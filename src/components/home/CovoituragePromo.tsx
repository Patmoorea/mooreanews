import Link from "next/link";
import { ArrowRight, Car, MapPin, Users } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getCarpoolOffers } from "@/lib/content";

/** Encart accueil — covoiturage en voiture vers le quai Vaiare. */
export async function CovoituragePromo() {
  const offers = await getCarpoolOffers();
  const count = offers.length;

  return (
    <section className="py-6 sm:py-8 bg-gradient-to-b from-lagon-50/80 to-white">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lagon-600 via-ocean-800 to-ocean-950 p-6 sm:p-8 lg:p-10 text-white shadow-[var(--shadow-tropical)]">
          <div
            aria-hidden
            className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -left-16 bottom-0 w-56 h-56 rounded-full bg-soleil-400/15 blur-3xl"
          />

          <div className="relative lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-lagon-200">
                <Car className="h-4 w-4" />
                Navette Papeete · Quai Vaiare
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl text-balance">
                Covoiturage en voiture vers le quai
              </h2>
              <p className="mt-3 text-sm sm:text-base text-ocean-100 text-pretty">
                Des milliers de navetteurs chaque jour : partagez la route en
                voiture pour aller au ferry ou rentrer sur l&apos;île. Moins de
                voitures au parking (~300&nbsp;XPF/jour), partage du carburant.
              </p>

              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-lagon-100">
                <li className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  Maharepa, Afareaitu → Quai Vaiare
                </li>
                <li className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 shrink-0" />
                  {count > 0
                    ? `${count} trajet${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`
                    : "Soyez le premier à proposer"}
                </li>
              </ul>
            </div>

            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                href="/covoiturage"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-ocean-900 shadow-lg hover:-translate-y-0.5 transition-transform"
              >
                Voir les trajets
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/covoiturage#proposer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition-colors"
              >
                Proposer un trajet
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
