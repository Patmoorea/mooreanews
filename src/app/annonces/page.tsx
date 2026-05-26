import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Tag, Calendar } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { getAnnouncements } from "@/lib/content";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Annonces — Moorea",
  description:
    "Petites annonces de Moorea : vente, achat, location, emploi, services, perdu/trouvé.",
};

const TYPE_LABELS = {
  vente: { label: "À vendre", variant: "tipanier" as const },
  achat: { label: "Recherche", variant: "lagon" as const },
  location: { label: "Location", variant: "ocean" as const },
  emploi: { label: "Emploi", variant: "tiare" as const },
  service: { label: "Service", variant: "soleil" as const },
  "perdu-trouve": { label: "Perdu/Trouvé", variant: "couchant" as const },
};

export default function AnnoncesPage() {
  const items = getAnnouncements();

  return (
    <>
      <PageHeader
        badge="Petites annonces"
        title="Vendre, acheter, louer, services"
        description="Les annonces des habitants de Moorea. Publiez la vôtre gratuitement."
        variant="soleil"
      />
      <Container className="py-12 sm:py-16">
        <div className="flex justify-end mb-6">
          <Link
            href="/soumettre"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-transform"
          >
            + Publier une annonce
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => {
            const t = TYPE_LABELS[a.type];
            return (
              <article
                key={a.slug}
                className="bg-white rounded-2xl border border-ocean-100 p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={t.variant}>{t.label}</Badge>
                  {a.price && (
                    <span className="text-sm font-bold text-tiare-600">
                      {a.price}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-lg text-ocean-900">
                  {a.title}
                </h2>
                <p className="mt-2 text-sm text-ocean-700">{a.body}</p>
                <div className="mt-4 pt-4 border-t border-ocean-100 space-y-1.5 text-xs text-ocean-600">
                  {a.district && (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={12} />
                      {a.district}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Phone size={12} />
                    <a
                      href={
                        a.contact.includes("@")
                          ? `mailto:${a.contact}`
                          : `tel:${a.contact.replace(/\s+/g, "")}`
                      }
                      className="hover:text-tiare-600"
                    >
                      {a.contact}
                    </a>
                  </p>
                  <p className="flex items-center gap-1.5 text-ocean-500">
                    <Calendar size={12} />
                    {timeAgo(a.publishedAt)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </>
  );
}
