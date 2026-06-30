import { purgeStaleExternalVeille } from "@/app/admin/external-actions";

type Props = {
  compact?: boolean;
};

/** Bandeau admin — masque les liens RSS avec année 2024 ou plus ancienne (ex. TAPUAE MANU). */
export function PurgeObsoleteVeilleBanner({ compact = false }: Props) {
  if (compact) {
    return (
      <form action={purgeStaleExternalVeille} className="inline">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-bold shadow-md hover:bg-amber-600"
        >
          🧹 Masquer veille obsolète (2024−)
        </button>
      </form>
    );
  }

  return (
    <section
      id="nettoyage-veille"
      className="mb-6 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm"
    >
      <h2 className="font-display text-lg text-amber-950">
        🧹 Nettoyage veille RSS obsolète
      </h2>
      <p className="mt-2 text-sm text-amber-900/90 max-w-2xl">
        Si l&apos;audit Telegram signale un lien type{" "}
        <strong>« TAPUAE MANU »</strong> ou une année <strong>2024</strong>, ce
        n&apos;est <em>pas</em> un article du site — c&apos;est la veille externe.
        Ce bouton masque toutes les entrées concernées et les bloque à la
        réimport.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form action={purgeStaleExternalVeille}>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-amber-600 text-white text-sm font-bold shadow-md hover:bg-amber-700"
          >
            Masquer toute la veille obsolète (2024 et avant)
          </button>
        </form>
        <a
          href="/admin/external?q=TAPUAE"
          className="text-sm font-semibold text-amber-800 underline hover:text-amber-950"
        >
          Rechercher « TAPUAE »
        </a>
      </div>
    </section>
  );
}
