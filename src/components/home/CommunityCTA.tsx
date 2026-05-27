import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { MessageCircle, Megaphone, Sparkles } from "lucide-react";
import { TROPICAL_EMOJI } from "@/components/decor/TropicalDecor";

export function CommunityCTA() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-lagon-50/30 to-transparent">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lagon-400 via-tipanier-400 to-tiare-400 p-1 shadow-[var(--shadow-tropical)]">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-ocean-800 via-ocean-900 to-ocean-950 p-8 sm:p-12 lg:p-16 text-white relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-soleil-300/20 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-tiare-400/20 blur-3xl"
            />

            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-widest border border-white/20">
                <Sparkles size={14} className="text-soleil-300" />
                {TROPICAL_EMOJI.welcome} Participer
              </div>
              <h2 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl text-balance">
                Vous avez une info ?{" "}
                <span className="bg-gradient-to-r from-soleil-300 via-tiare-300 to-tiare-400 bg-clip-text text-transparent">
                  Partagez-la !
                </span>
              </h2>
              <p className="mt-4 text-lg text-ocean-200 max-w-2xl text-pretty">
                Un événement, une annonce, un service, un commerce, une info
                utile pour les habitants ? Publiez-la gratuitement en 2
                minutes. Validation par notre équipe sous 24h.
              </p>

              <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-2xl">
                <Feature
                  icon={<Megaphone size={20} />}
                  title="Gratuit"
                  desc="Aucun frais pour publier"
                />
                <Feature
                  icon={<MessageCircle size={20} />}
                  title="Rapide"
                  desc="Validation en 24h"
                />
                <Feature
                  icon={<Sparkles size={20} />}
                  title="Local"
                  desc="Vu par toute l'île"
                />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/soumettre"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-ocean-900 font-semibold shadow-lg hover:-translate-y-0.5 transition-transform"
                >
                  + Publier une info
                </Link>
                <Link
                  href="/annonces"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur text-white border border-white/30 hover:bg-white/20 transition-colors"
                >
                  Voir les annonces
                </Link>
                <Link
                  href="/associations"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur text-white border border-white/30 hover:bg-white/20 transition-colors"
                >
                  Associations
                </Link>
                <Link
                  href="/partenaires"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur text-white border border-white/30 hover:bg-white/20 transition-colors"
                >
                  Partenaires & tarifs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-soleil-300 flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-ocean-300">{desc}</p>
      </div>
    </div>
  );
}
