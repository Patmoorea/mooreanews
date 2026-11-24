import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { RechercheClient } from "@/components/search/RechercheClient";

/**
 * Coquille statique. La requête `?q=` est lue dans le navigateur
 * et part vers /api/search — un bot qui ne exécute pas le JS ne réveille pas la fonction.
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Rechercher dans toute la base de MooreaNews.",
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <>
      <PageHeader
        badge="Recherche"
        title="Que cherchez-vous ?"
        description="Tapez votre recherche dans la barre ci-dessous"
        variant="lagon"
      />
      <RechercheClient />
    </>
  );
}
