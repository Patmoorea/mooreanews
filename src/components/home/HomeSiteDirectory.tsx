import { LayoutGrid } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { WaveDivider } from "@/components/decor/TropicalDecor";
import { SiteDirectoryAccordion } from "@/components/home/SiteDirectoryAccordion";

/** Plan du site complet — toutes les rubriques publiques depuis l’accueil. */
export function HomeSiteDirectory() {
  return (
    <section
      id="plan-du-site"
      className="relative py-16 sm:py-20 bg-gradient-to-b from-white via-sable-50/80 to-lagon-50/50 scroll-mt-36 md:scroll-mt-44"
      aria-labelledby="plan-du-site-title"
    >
      <WaveDivider className="text-white absolute top-0 rotate-180 -mt-px" />
      <Container className="relative">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ocean-100 text-ocean-800 text-xs font-semibold uppercase tracking-widest border border-ocean-200/60">
            <LayoutGrid size={14} aria-hidden />
            Plan du site
          </span>
          <h2
            id="plan-du-site-title"
            className="mt-4 font-display text-3xl sm:text-4xl text-ocean-950"
          >
            Toutes les pages MooreaNews
          </h2>
          <p className="mt-2 text-ocean-600 text-sm">
            Cliquez sur une rubrique pour voir les pages.
          </p>
        </div>

        <SiteDirectoryAccordion />
      </Container>
    </section>
  );
}
