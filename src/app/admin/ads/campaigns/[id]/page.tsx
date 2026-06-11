import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdCampaignForm } from "@/components/admin/AdCampaignForm";
import { saveAdCampaign } from "@/app/admin/ads-actions";
import { DeleteAdCampaignButton } from "@/components/admin/DeleteAdCampaignButton";
import { getAdCampaignAdmin } from "@/lib/ads";
import { getAdPackage, DEFAULT_CAMPAIGN_PACKAGE } from "@/lib/ad-packages";
import type { AdPackageId } from "@/lib/ads-types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const row = await getAdCampaignAdmin(id);
  return { title: row ? `Campagne — ${row.name}` : "Campagne pub" };
}

export default async function EditAdCampaignPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const campaign = await getAdCampaignAdmin(id);
  if (!campaign) notFound();
  const packageId: AdPackageId =
    (campaign.ad_package as AdPackageId) ||
    DEFAULT_CAMPAIGN_PACKAGE[id] ||
    "cible";
  const pkg = getAdPackage(packageId);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={campaign.name}
        description={`Forfait ${pkg.name} · identifiant : ${campaign.id}`}
      />

      {sp.saved === "1" && (
        <p className="rounded-xl border border-tipanier-200 bg-tipanier-50 px-4 py-3 text-sm text-tipanier-900">
          Campagne enregistrée — visible sur les emplacements inclus dans le forfait{" "}
          {pkg.name} si la campagne est active.
        </p>
      )}

      <AdCampaignForm action={saveAdCampaign} initial={campaign} />

      <div className="flex items-center justify-between pt-4 border-t border-ocean-100">
        <Link href="/admin/ads" className="text-sm text-ocean-600 hover:text-tiare-600">
          ← Retour aux publicités
        </Link>
        <DeleteAdCampaignButton id={campaign.id} name={campaign.name} />
      </div>
    </div>
  );
}
