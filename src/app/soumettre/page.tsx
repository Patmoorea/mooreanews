import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { SubmitForm } from "@/components/SubmitForm";
import { CheckCircle2, Clock, Eye, Megaphone } from "lucide-react";
import { staticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = staticPageMetadata({
  title: "Publier une info — Moorea",
  description:
    "Publiez gratuitement votre événement, annonce, service ou info pratique sur MooreaNews. Validation sous 24h.",
  path: "/soumettre",
});

export default function SoumettrePage() {
  return (
    <>
      <PageHeader
        badge="Publier"
        title="Partagez votre info"
        description="Envoyez votre affiche (photo du flyer). L’équipe la met en ligne sous 24 h après vérification."
        variant="tiare"
      />

      <Container className="py-12 sm:py-16">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10">
          <aside className="space-y-6">
            <h2 className="font-display text-2xl text-ocean-900">
              Comment ça marche ?
            </h2>
            <ol className="space-y-5">
              <Step
                num="1"
                icon={<Megaphone size={18} />}
                title="Vous publiez"
                text="Choisissez la photo de votre affiche en premier, puis le titre. C’est tout ce qu’il faut dans la plupart des cas."
              />
              <Step
                num="2"
                icon={<Clock size={18} />}
                title="On vérifie en 24h"
                text="Notre équipe vérifie le contenu pour éviter spam et arnaques."
              />
              <Step
                num="3"
                icon={<CheckCircle2 size={18} />}
                title="Vous êtes notifié"
                text="On vous prévient par email/SMS dès la mise en ligne."
              />
              <Step
                num="4"
                icon={<Eye size={18} />}
                title="L'île vous voit"
                text="Vu par les habitants et les visiteurs de Moorea."
              />
            </ol>

            <div className="rounded-2xl bg-tiare-50 border border-tiare-200 p-5 text-sm">
              <p className="font-semibold text-tiare-700">
                💡 Conseil
              </p>
              <p className="mt-1 text-tiare-700/90">
                Pour vos événements, indiquez bien le lieu exact, l&apos;heure et
                le contact. Ça augmente les chances que les gens viennent !
              </p>
            </div>

            <div className="rounded-2xl bg-ocean-50 border border-ocean-100 p-5 text-sm">
              <p className="font-semibold text-ocean-900">
                Vous êtes un professionnel ?
              </p>
              <p className="mt-1 text-ocean-700">
                Les annonces et événements passent ici gratuitement. Pour une
                bannière ou une mise en avant restaurant, écrivez-nous via la{" "}
                <a
                  href="/contact"
                  className="text-tiare-600 font-semibold hover:underline"
                >
                  page Contact
                </a>
                .
              </p>
            </div>
          </aside>

          <div>
            <SubmitForm />
          </div>
        </div>
      </Container>
    </>
  );
}

function Step({
  num,
  icon,
  title,
  text,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-600 text-white flex items-center justify-center font-display text-lg shadow-md">
        {num}
      </div>
      <div>
        <p className="font-semibold text-ocean-900 flex items-center gap-2">
          <span className="text-tiare-500">{icon}</span>
          {title}
        </p>
        <p className="text-sm text-ocean-600 mt-1">{text}</p>
      </div>
    </li>
  );
}
