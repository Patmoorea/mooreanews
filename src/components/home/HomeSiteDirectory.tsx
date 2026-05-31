import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { WaveDivider } from "@/components/decor/TropicalDecor";
import { SITE_DIRECTORY } from "@/lib/site-directory";

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
            Classées par thème — accès direct sans chercher dans le footer.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {SITE_DIRECTORY.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl border border-ocean-100 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 bg-gradient-to-r from-ocean-50 to-lagon-50/80 border-b border-ocean-100">
                <h3 className="font-display text-lg text-ocean-950">
                  {category.title}
                </h3>
                <p className="text-xs text-ocean-600 mt-0.5">
                  {category.description}
                </p>
              </div>
              <ul className="divide-y divide-ocean-50">
                {category.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-lagon-50/80 transition-colors"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-ocean-900 group-hover:text-tiare-700">
                          {link.label}
                        </span>
                        <span className="block text-xs text-ocean-500 mt-0.5">
                          {link.description}
                        </span>
                      </span>
                      <ArrowRight
                        size={16}
                        className="shrink-0 mt-0.5 text-ocean-300 group-hover:text-tiare-500 group-hover:translate-x-0.5 transition-all"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
