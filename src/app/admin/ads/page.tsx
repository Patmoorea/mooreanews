import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdSlotsEditor } from "@/components/admin/AdSlotsEditor";
import { getAdsConfig, listAdCampaignsAdmin, listAdSlotsAdmin } from "@/lib/ads";
import { seedAdDefaults } from "@/app/admin/ads-actions";

export const metadata = { title: "Publicités" };

type Props = {
  searchParams: Promise<{ seeded?: string }>;
};

export default async function AdminAdsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [config, campaigns, slots] = await Promise.all([
    getAdsConfig(),
    listAdCampaignsAdmin(),
    listAdSlotsAdmin(),
  ]);

  const dbReady = campaigns.length > 0 && slots.length > 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Publicités & partenaires"
        description={
          dbReady
            ? `${campaigns.length} campagne(s) · ${slots.filter((s) => s.enabled).length}/${slots.length} emplacements actifs · source : ${config.source}`
            : "Tables Supabase non initialisées — les valeurs par défaut du code sont utilisées sur le site."
        }
        newHref="/admin/ads/campaigns/new"
        newLabel="Nouvelle campagne"
      />

      {params.seeded === "1" && (
        <p className="rounded-xl border border-tipanier-200 bg-tipanier-50 px-4 py-3 text-sm text-tipanier-900">
          Données publicitaires initialisées avec succès.
        </p>
      )}

      {!dbReady ? (
        <div className="rounded-2xl border border-soleil-200 bg-soleil-50 p-5 text-sm text-ocean-800">
          <p className="font-semibold">Activer la gestion en base</p>
          <p className="mt-2">
            Exécutez <code className="text-xs bg-white px-1 rounded">supabase/site-ads.sql</code>{" "}
            dans Supabase SQL Editor, ou cliquez ci-dessous pour importer les valeurs par défaut
            (Moorea Maitai + 12 emplacements).
          </p>
          <form action={seedAdDefaults} className="mt-4">
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-ocean-950 text-white text-sm font-semibold hover:bg-ocean-900"
            >
              Initialiser les publicités
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-ocean-100 bg-ocean-50/60 p-4 text-sm text-ocean-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p>
            Met à jour les campagnes (Maitai, RAI TAHITI…) et tous les emplacements, y compris
            les 10 rubans pied de page.
          </p>
          <form action={seedAdDefaults} className="shrink-0">
            <button
              type="submit"
              className="px-4 py-2 rounded-full border border-ocean-200 bg-white text-ocean-900 text-sm font-semibold hover:bg-ocean-50"
            >
              Resynchroniser les valeurs par défaut
            </button>
          </form>
        </div>
      )}

      <section>
        <h2 className="font-display text-xl text-ocean-950 mb-4">Campagnes</h2>
        <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
              <tr>
                <th className="px-4 py-3 text-left">Campagne</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Lien</th>
                <th className="px-4 py-3 text-center">État</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-100">
              {(dbReady
                ? campaigns.map((c) => ({
                    id: c.id,
                    name: c.name,
                    href: c.href,
                    active: c.active,
                  }))
                : Object.values(config.campaigns)
              ).map((c) => (
                  <tr key={c.id} className="hover:bg-ocean-50/40">
                    <td className="px-4 py-3">
                      <Link
                        href={dbReady ? `/admin/ads/campaigns/${c.id}` : "#"}
                        className="font-medium text-ocean-900 hover:text-tiare-600"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-ocean-600 text-xs truncate max-w-xs">
                      {c.href}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.active ? (
                        <span className="px-2 py-0.5 rounded-full bg-tipanier-100 text-tipanier-700 text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-600 text-xs">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {dbReady ? (
                        <Link
                          href={`/admin/ads/campaigns/${c.id}`}
                          className="text-xs font-semibold text-lagon-700 hover:underline"
                        >
                          Modifier
                        </Link>
                      ) : (
                        <span className="text-xs text-ocean-400">Init. requise</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {dbReady && (
        <section>
          <h2 className="font-display text-xl text-ocean-950 mb-2">Emplacements sur le site</h2>
          <p className="text-sm text-ocean-600 mb-4">
            Les campagnes actives alternent automatiquement sur chaque zone (toutes les 30 min).
            Le pied de page affiche tous les partenaires actifs côte à côte.
          </p>
          <AdSlotsEditor slots={slots} campaigns={campaigns} />
        </section>
      )}

      <p className="text-xs text-ocean-500">
        Grille tarifaire publique :{" "}
        <Link href="/partenaires" className="text-lagon-700 hover:underline">
          /partenaires
        </Link>
      </p>
    </div>
  );
}
