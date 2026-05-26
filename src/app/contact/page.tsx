import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { ContactForm } from "@/components/ContactForm";
import { SITE, SOCIAL } from "@/lib/constants";
import { FacebookIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";

export const metadata: Metadata = {
  title: "Contact — Moorea Hub",
  description:
    "Contactez l'équipe de Moorea Hub : signalement, partenariat, suggestion d'amélioration, presse.",
};

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
                value="Page Moorea Hub"
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
