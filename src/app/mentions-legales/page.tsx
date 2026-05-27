import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mentions légales — MooreaNews",
  robots: { index: true, follow: false },
};

export default function MentionsLegalesPage() {
  return (
    <>
      <PageHeader
        badge="Légal"
        title="Mentions légales"
        variant="ocean"
      />
      <Container size="narrow" className="py-12 sm:py-16">
        <div className="prose-tropical space-y-6 text-ocean-800">
          <section>
            <h2 className="font-display text-2xl text-ocean-950">Éditeur</h2>
            <p>
              <strong>{SITE.name}</strong>
              <br />
              Site édité par l&apos;équipe de MooreaNews.
              <br />
              Email : {SITE.email}
              <br />
              Adresse : Moorea, Polynésie française.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ocean-950">Hébergement</h2>
            <p>
              Hébergé par <strong>Vercel Inc.</strong>
              <br />
              340 S Lemon Ave #4133, Walnut, CA 91789, USA
              <br />
              vercel.com
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ocean-950">
              Propriété intellectuelle
            </h2>
            <p>
              L&apos;ensemble des contenus de ce site (textes, images,
              vidéos, design) est protégé par le droit d&apos;auteur. Toute
              reproduction sans autorisation préalable est interdite.
            </p>
            <p>
              Les contenus soumis par les utilisateurs restent la propriété
              de leurs auteurs. En soumettant un contenu, l&apos;auteur
              concède à {SITE.name} une licence non exclusive d&apos;affichage
              et de diffusion sur le site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ocean-950">Données personnelles</h2>
            <p>
              Voir notre{" "}
              <a
                href="/confidentialite"
                className="text-tiare-600 underline"
              >
                politique de confidentialité
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ocean-950">Sources externes</h2>
            <p>Données live affichées sur le site :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Météo :{" "}
                <a
                  href="https://openweathermap.org"
                  className="text-tiare-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenWeatherMap
                </a>
              </li>
              <li>
                Lever/coucher du soleil :{" "}
                <a
                  href="https://sunrise-sunset.org"
                  className="text-tiare-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sunrise-sunset.org
                </a>
              </li>
              <li>
                Ferries Tahiti↔Moorea :{" "}
                <a
                  href="https://www.horaires-tahiti.com"
                  className="text-tiare-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  horaires-tahiti.com
                </a>
              </li>
              <li>Marées : calcul interne (algorithme semi-diurne lunaire)</li>
            </ul>
          </section>
        </div>
      </Container>
    </>
  );
}
