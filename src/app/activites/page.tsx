import type { Metadata } from "next";
import { MapPin, Clock, Tag, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { getActivities } from "@/lib/content";

export const metadata: Metadata = {
  title: "Activités à Moorea",
  description:
    "Plongée, randonnée, lagon, baleines, kayak, culture : toutes les activités à faire sur Moorea.",
};

const CATEGORY_LABELS = {
  plongee: "Plongée",
  randonnee: "Randonnée",
  lagon: "Lagon",
  culture: "Culture",
  nature: "Nature",
  sport: "Sport",
  famille: "Famille",
} as const;

export default function ActivitesPage() {
  const items = getActivities();

  return (
    <>
      <PageHeader
        badge="À faire"
        title="Activités à Moorea"
        description="Plongée, randonnée, lagon, observation des baleines : les meilleures expériences de l'île."
        variant="tipanier"
      />
      <Container className="py-12 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <article
              key={a.slug}
              className="bg-white rounded-2xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:-translate-y-1 transition-all"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-tipanier-300 via-lagon-300 to-ocean-400" />
              <div className="p-5">
                <Badge variant="tipanier">{CATEGORY_LABELS[a.category]}</Badge>
                <h2 className="mt-2 font-display text-lg text-ocean-900">
                  {a.name}
                </h2>
                <p className="mt-2 text-sm text-ocean-700">{a.description}</p>
                <div className="mt-4 space-y-1.5 text-xs text-ocean-600">
                  {a.district && (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={12} />
                      {a.district}
                    </p>
                  )}
                  {a.duration && (
                    <p className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {a.duration}
                    </p>
                  )}
                  {a.price && (
                    <p className="flex items-center gap-1.5">
                      <Tag size={12} />
                      {a.price}
                    </p>
                  )}
                  {a.website && (
                    <a
                      href={a.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-tipanier-700 hover:text-tipanier-800"
                    >
                      <ExternalLink size={12} />
                      Site officiel
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </>
  );
}
