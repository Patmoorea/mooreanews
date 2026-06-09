import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Megaphone, MessageCircle, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { ContactForm } from "@/components/ContactForm";
import { SITE, SOCIAL } from "@/lib/constants";
import { FacebookIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { staticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = staticPageMetadata({
  title: "Contact — MooreaNews",
  description:
    "Contactez l'équipe de MooreaNews : signalement, partenariat, suggestion d'amélioration, presse.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHeader
        badge="Contact"
        title="On vous écoute"
        description="Signalez une info erronée, suggérez une amélioration, proposez un partenariat ou rejoignez l'aventure."
        variant="lagon"
      />

      <Container className="py-12 sm:py-16">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10">
          <aside className="space-y-6">
            <div>
              <h2 className="font-display text-2xl text-ocean-900">
                Plusieurs façons de nous joindre
              </h2>
              <p className="mt-2 text-ocean-700">
                Choisissez le canal qui vous convient le mieux.
              </p>
            </div>

            <ul className="space-y-4">
              <ContactCard
                icon={<Mail size={20} />}
                title="Email"
                value={SITE.email}
                href={`mailto:${SITE.email}`}
                description="Réponse sous 24h ouvrées"
                color="from-lagon-400 to-ocean-600"
              />
              <ContactCard
                icon={<MessageCircle size={20} />}
                title="WhatsApp"
                value={SOCIAL.whatsapp}
                href={`https://wa.me/${SOCIAL.whatsapp.replace(/\D/g, "")}`}
                description="Le plus rapide"
                color="from-tipanier-400 to-tipanier-600"
              />
              <ContactCard
                icon={<FacebookIcon size={20} />}
                title="Facebook"
                value="Page MooreaNews"
                href={SOCIAL.facebook}
                description="Messages et actualités"
                color="from-ocean-500 to-ocean-700"
              />
              <ContactCard
                icon={<MapPin size={20} />}
                title="Localisation"
                value="Moorea, Polynésie française"
                description="Île de Moorea-Maiao"
                color="from-tiare-400 to-tiare-600"
              />
            </ul>

            <div className="rounded-2xl border border-lagon-200 bg-lagon-50 p-5 text-sm space-y-4">
              <h3 className="font-display text-lg text-ocean-900">
                Professionnels — publier ou se mettre en avant
              </h3>
              <div>
                <p className="font-semibold text-ocean-800 flex items-center gap-2">
                  <Megaphone size={16} className="text-lagon-600" />
                  Annonces & événements (gratuit)
                </p>
                <p className="mt-1 text-ocean-700">
                  Commerces, associations, prestataires : publiez une petite
                  annonce, un événement ou un service via{" "}
                  <Link
                    href="/soumettre"
                    className="text-tiare-600 font-semibold hover:underline"
                  >
                    Publier une info
                  </Link>
                  . Validation sous 24 h, sans publicité intrusive sur le site.
                </p>
              </div>
              <div>
                <p className="font-semibold text-ocean-800 flex items-center gap-2">
                  <Star size={16} className="text-soleil-500" />
                  Visibilité renforcée (restaurants, partenaires)
                </p>
                <p className="mt-1 text-ocean-700">
                  Mise en avant type « Premium » sur la page Restaurants ou
                  encart partenaire : contactez-nous avec votre activité, la
                  durée souhaitée et un visuel. Nous vous répondons par email
                  avec les modalités (pas de paiement en ligne pour l&apos;instant).
                </p>
                <p className="mt-2">
                  <a
                    href="/partenaires"
                    className="text-tiare-600 font-semibold hover:underline"
                  >
                    Voir la page Annonceurs & partenaires
                  </a>
                </p>
              </div>
            </div>
          </aside>

          <ContactForm />
        </div>
      </Container>
    </>
  );
}

function ContactCard({
  icon,
  title,
  value,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  href?: string;
  color: string;
}) {
  const Wrapper = href ? "a" : "div";
  const props = href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <li>
      <Wrapper
        {...props}
        className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-ocean-100 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] transition-all"
      >
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-ocean-500 font-semibold">
            {title}
          </p>
          <p className="font-display text-lg text-ocean-900 truncate">
            {value}
          </p>
          <p className="text-xs text-ocean-600">{description}</p>
        </div>
      </Wrapper>
    </li>
  );
}
