import Link from "next/link";
import { Ambulance, ExternalLink, Phone } from "lucide-react";
import { RAI_TAHITI } from "@/lib/constants";

type Props = {
  variant?: "default" | "compact";
};

/** Encart visible — transport sanitaire RAI TAHITI (partenaire local). */
export function RaiTahitiSpotlight({ variant = "default" }: Props) {
  if (variant === "compact") {
    return (
      <div className="rounded-2xl border border-tiare-200 bg-gradient-to-br from-white to-tiare-50 p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tiare-500 to-tiare-600 text-white flex items-center justify-center flex-shrink-0">
            <Ambulance size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-tiare-700">
              Transport sanitaire
            </p>
            <p className="font-display text-lg text-ocean-950">{RAI_TAHITI.name}</p>
            <p className="text-sm text-ocean-700 mt-0.5">{RAI_TAHITI.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={RAI_TAHITI.phoneHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tiare-500 text-white text-xs font-semibold"
              >
                <Phone size={12} />
                {RAI_TAHITI.phoneMoorea}
              </a>
              <Link
                href={RAI_TAHITI.infoPath}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-ocean-200 text-ocean-800 text-xs font-semibold hover:bg-ocean-50"
              >
                Fiche MooreaNews
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl overflow-hidden border border-tiare-200/80 shadow-[var(--shadow-tropical)] bg-gradient-to-br from-tiare-50 via-white to-lagon-50">
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 p-6 sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tiare-100 text-tiare-800 text-xs font-semibold uppercase tracking-widest">
            <Ambulance size={14} />
            Partenaire santé
          </p>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl text-ocean-950">
            {RAI_TAHITI.name} — ambulance & VSL
          </h2>
          <p className="mt-2 text-ocean-700 max-w-xl">
            Transport médical conventionné CPS entre <strong>Moorea</strong> et{" "}
            <strong>Tahiti</strong>, disponible 7j/7. Base à Pihaena (PK 14,5).
          </p>
          <ul className="mt-4 space-y-1 text-sm text-ocean-800">
            <li>
              Moorea :{" "}
              <a
                href={RAI_TAHITI.phoneHref}
                className="font-semibold text-tiare-600 hover:text-tiare-700"
              >
                {RAI_TAHITI.phoneMoorea}
              </a>
            </li>
            <li>Tahiti : {RAI_TAHITI.phoneTahiti}</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={RAI_TAHITI.phoneHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-tiare-500 to-tiare-600 text-white font-semibold shadow-md hover:-translate-y-0.5 transition-transform"
            >
              <Phone size={16} />
              Appeler Moorea
            </a>
            <Link
              href={RAI_TAHITI.infoPath}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-ocean-200 bg-white text-ocean-900 font-semibold hover:border-tiare-300 transition-colors"
            >
              Fiche infos pratiques
            </Link>
            <a
              href={RAI_TAHITI.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-ocean-700 font-semibold hover:text-tiare-600 transition-colors"
            >
              raitahiti.com
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
        <div
          className="hidden lg:flex w-32 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-tiare-400 to-tiare-600 text-white p-4 text-center"
          aria-hidden
        >
          <Ambulance size={48} className="opacity-90" />
          <span className="mt-2 text-xs font-bold uppercase tracking-wider">
            VSL CPS
          </span>
        </div>
      </div>
    </section>
  );
}
