import type { Metadata } from "next";
import { HomeV2Page } from "@/components/home-v2/HomeV2Page";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Accueil v2 (essai)",
  description:
    "Prototype mobile MooreaNews — dashboard météo, ferries, alertes et actus en un coup d'œil.",
  robots: { index: false, follow: false },
};

/** Prototype homepage v2 — n’affecte pas l’accueil classique (/). */
export default function AccueilV2Page() {
  return <HomeV2Page />;
}
