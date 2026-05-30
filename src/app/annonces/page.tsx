import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Calendar } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { PublicationCard } from "@/components/PublicationCard";
import { getAnnouncements } from "@/lib/content";
import { expireStaleAnnouncements } from "@/lib/announcement-expiry";
import { ANNOUNCEMENT_TYPE_LABELS } from "@/lib/content-labels";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Annonces — Moorea",
  description:
    "Petites annonces de Moorea avec affiches : vente, location, emploi, services.",
  alternates: { canonical: "/annonces" },
};

export default async function AnnoncesPage() {
  await expireStaleAnnouncements();
  const items = await getAnnouncements();

  return (
    <>
      <PageHeader
        badge="Petites annonces"
        title="Vendre, acheter, louer, services"
        description="Les annonces des habitants de Moorea, souvent sous forme d’affiche photo."
        variant="soleil"
      />
      <Container className="py-12 sm:py-16">
        <div className="flex flex-wrap justify-end gap-3 mb-6">
          <Link
            href="/soumettre"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-500 text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-transform"
          >
            + Publier une annonce (avec affiche)
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-ocean-600 py-12">
            Aucune annonce pour le moment.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => {
              const t = ANNOUNCEMENT_TYPE_LABELS[a.type];
              return (
                <PublicationCard
                  key={a.slug}
                  href={`/annonces/${a.slug}`}
                  title={a.title}
                  image={a.image}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={t.variant}>{t.label}</Badge>
                    {a.price && (
                      <span className="text-sm font-bold text-tiare-600">
                        {a.price}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-lg text-ocean-900 group-hover:text-tiare-600 transition-colors">
                    {a.title}
                  </h2>
                  <p className="mt-2 text-sm text-ocean-700 line-clamp-3">
                    {a.body}
                  </p>
                  <div className="mt-4 pt-4 border-t border-ocean-100 space-y-1.5 text-xs text-ocean-600">
                    {a.district && (
                      <p className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        {a.district}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Phone size={12} />
                      <span className="truncate">{a.contact}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-ocean-500">
                      <Calendar size={12} />
                      {timeAgo(a.publishedAt)}
                    </p>
                  </div>
                </PublicationCard>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
