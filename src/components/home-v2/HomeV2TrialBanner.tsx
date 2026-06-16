import Link from "next/link";
import { Sparkles } from "lucide-react";

/** Bandeau discret sur l’accueil classique — lien vers le prototype v2. */
export function HomeV2TrialBanner() {
  if (process.env.NEXT_PUBLIC_HOME_V2_TRIAL === "false") return null;

  return (
    <div className="bg-gradient-to-r from-lagon-600 to-ocean-700 text-white text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 min-w-0">
          <Sparkles size={16} className="shrink-0 text-soleil-200" aria-hidden />
          <span className="truncate">
            <strong className="font-semibold">Essai v2</strong>
            <span className="hidden sm:inline">
              {" "}
              — accueil mobile dashboard (retour classique à tout moment)
            </span>
          </span>
        </p>
        <Link
          href="/accueil-v2"
          className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold border border-white/20 transition-colors whitespace-nowrap"
        >
          Voir l&apos;essai v2
        </Link>
      </div>
    </div>
  );
}
