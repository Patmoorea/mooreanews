import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdCampaignForm } from "@/components/admin/AdCampaignForm";
import { saveAdCampaign } from "@/app/admin/ads-actions";

export const metadata = { title: "Nouvelle campagne pub" };

export default function NewAdCampaignPage() {
  return (
    <div>
      <AdminPageHeader
        title="Nouvelle campagne"
        description="Créez une bannière partenaire (visuel, lien, texte alternatif)."
      />
      <AdCampaignForm action={saveAdCampaign} />
    </div>
  );
}
