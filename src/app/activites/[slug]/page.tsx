import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Tag,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShareButtons } from "@/components/ShareButtons";
import { getActivities, getActivityBySlug } from "@/lib/content";
import { ACTIVITY_CATEGORY_LABELS } from "@/lib/content-labels";
import { SITE } from "@/lib/constants";
import { PosterImage, hasPoster } from "@/components/PosterImage";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const items = await getActivities();
  return items.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getActivityBySlug(slug);
  if (!item) return { title: "Activité introuvable" };
  return {
    title: `${item.name} — Activité à Moorea`,
    description: item.description,
    alternates: { canonical: `/activites/${item.slug}` },
    openGraph: { title: item.name, description: item.description },
  };
}

export default async function ActiviteDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getActivityBySlug(slug);
  if (!item) notFound();

  const all = await getActivities();
  const related = all
    .filter((a) => a.slug !== item.slug && a.category === item.category)
    .slice(0, 3);

  const shareUrl = `${SITE.url}/activites/${item.slug}`;

  return (
    <article>
      <section className="relative overflow-hidden bg-gradient-to-b from-tipanier-100 via-lagon-50 to-white">
        <Container className="relative py-12 sm:py-16">
          <Link
            href="/activites"
            className="inline-flex items-center gap-2 text-sm text-ocean-600 hover:text-tiare-600 mb-6"
          >
            <ArrowLeft size={16} />
            Toutes les activités
          </Link>
          <Badge variant="tipanier">{ACTIVITY_CATEGORY_LABELS[item.category]}</Badge>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl text-ocean-950 text-balance">
            {item.name}
          </h1>
          <p className="mt-4 text-xl text-ocean-700 max-w-2xl text-pretty">
            {item.description}
          </p>
          {hasPoster(item.image) ? (
            <PosterImage
              src={item.image!}
              alt={`Photo — ${item.name}`}
              className="mt-8 w-full max-w-lg aspect-[4/3]"
            />
          ) : null}
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-ocean-100 bg-white p-6 space-y-3 text-ocean-800">
              {item.district && (
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="text-tipanier-600" />
                  {item.district}
                </p>
              )}
              {item.duration && (
                <p className="flex items-center gap-2">
                  <Clock size={16} className="text-tipanier-600" />
                  {item.duration}
                </p>
              )}
              {item.price && (
                <p className="flex items-center gap-2">
                  <Tag size={16} className="text-tipanier-600" />
                  {item.price}
                </p>
              )}
              {item.contact && (
                <p className="flex items-center gap-2">
                  <Phone size={16} className="text-tipanier-600" />
                  <a
                    href={`tel:${item.contact.replace(/\s+/g, "")}`}
                    className="font-semibold hover:text-tiare-600"
                  >
                    {item.contact}
                  </a>
                </p>
              )}
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-tipanier-700 font-semibold hover:text-tiare-600"
                >
                  <ExternalLink size={16} />
                  Site officiel
                </a>
              )}
            </div>
            <ShareButtons url={shareUrl} title={item.name} description={item.description} />
          </div>

          {related.length > 0 && (
            <aside>
              <h2 className="font-display text-xl text-ocean-950 mb-4">
                Activités similaires
              </h2>
              <ul className="space-y-3">
                {related.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/activites/${a.slug}`}
                      className="block rounded-xl border border-ocean-100 p-4 hover:border-tiare-300 hover:shadow-md transition-all"
                    >
                      <p className="font-semibold text-ocean-900">{a.name}</p>
                      <p className="text-sm text-ocean-600 line-clamp-2 mt-1">
                        {a.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </Container>

      {/* JSON-LD (Activité) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: item.name,
            description: item.description,
            url: shareUrl,
            telephone: item.contact || undefined,
            sameAs: item.website || undefined,
            address: {
              "@type": "PostalAddress",
              addressLocality: item.district || "Moorea",
              addressCountry: "PF",
            },
          }),
        }}
      />
    </article>
  );
}
