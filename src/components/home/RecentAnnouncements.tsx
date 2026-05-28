import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PublicationCard } from "@/components/PublicationCard";
import { getAnnouncements } from "@/lib/content";
import { ANNOUNCEMENT_TYPE_LABELS } from "@/lib/content-labels";

export async function RecentAnnouncements() {
  const items = (await getAnnouncements()).slice(0, 6);

  if (items.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-soleil-50 via-white to-lagon-50">
      <Container>
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soleil-100 text-soleil-800 text-xs font-semibold uppercase tracking-widest border border-soleil-200/60">
              Petites annonces
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-ocean-950">
              Annonces avec affiches
            </h2>
          </div>
          <Link
            href="/annonces"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-ocean-700 hover:text-tiare-600"
          >
            Toutes les annonces
            <ArrowRight size={16} />
          </Link>
        </div>

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
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={t.variant}>{t.label}</Badge>
                  {a.price ? (
                    <span className="text-sm font-bold text-tiare-600">
                      {a.price}
                    </span>
                  ) : null}
                </div>
                <h3 className="font-display text-lg text-ocean-900 group-hover:text-tiare-600 transition-colors">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm text-ocean-600 line-clamp-2">
                  {a.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-ocean-500">
                  {a.district ? (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {a.district}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <Phone size={12} />
                    {a.contact}
                  </span>
                </div>
              </PublicationCard>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            href="/annonces"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700"
          >
            Toutes les annonces
            <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
