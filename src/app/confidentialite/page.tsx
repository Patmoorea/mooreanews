import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Confidentialité — MooreaNews",
  robots: { index: true, follow: false },
};

export default function ConfidentialitePage() {
  return (
    <>
      <PageHeader
        badge="Vie privée"
        title="Politique de confidentialité"
        variant="ocean"
      />
      <Container size="narrow" className="py-12 sm:py-16">
        <div className="prose-tropical space-y-6 text-ocean-800 leading-relaxed">
          <p>
            <strong>{SITE.name}</strong> respecte votre vie privée. Cette page
            explique en termes simples quelles données nous collectons,
            pourquoi, et comment vous pouvez les supprimer.
          </p>

          <section>
            <h2 className="font-display text-2xl text-ocean-950">
              Données collectées
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Newsletter</strong> : votre adresse email, conservée
                tant que vous restez abonné.
              </li>
              <li>
                <strong>Soumission d&apos;une publication</strong> : nom,
                contact, contenu de la publication. Affichés sur le site
                après modération.
              </li>
              <li>
                <strong>Contact</strong> : nom, email, message — utilisés
                uniquement pour vous répondre.
              </li>
              <li>
                <strong>Statistiques anonymes</strong> : pages vues,
                appareil, pays (sans cookies de pistage).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ocean-950">
              À qui sont transmises vos données
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Resend</strong> (envoi d&apos;emails)
              </li>
              <li>
                <strong>Vercel</strong> (hébergement)
              </li>
              <li>
                <strong>Telegram</strong> (notifications admin uniquement,
                pas pour le visiteur)
              </li>
            </ul>
            <p>
              Aucune donnée n&apos;est revendue à des tiers. Aucun cookie
              de pistage publicitaire n&apos;est utilisé.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ocean-950">Vos droits</h2>
            <p>
              Conformément à la loi, vous pouvez à tout moment demander :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>L&apos;accès à vos données personnelles</li>
              <li>La modification ou la suppression de vos données</li>
              <li>La désinscription de la newsletter (lien dans chaque email)</li>
              <li>Le retrait d&apos;une publication que vous avez soumise</li>
            </ul>
            <p>
              Pour exercer ces droits, écrivez-nous à{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="text-tiare-600 underline"
              >
                {SITE.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ocean-950">Cookies</h2>
            <p>
              Nous n&apos;utilisons aucun cookie publicitaire ni cookie de
              pistage. Les seuls cookies présents sont strictement
              nécessaires au bon fonctionnement du site (préférences
              d&apos;affichage, fermeture du bandeau d&apos;info).
            </p>
          </section>
        </div>
      </Container>
    </>
  );
}
