import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShareButtons } from "@/components/ShareButtons";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import {
  getAllInfoPratiqueSlugs,
  getInfoPratiqueBySlug,
} from "@/lib/content";
import { INFO_CATEGORY_LABELS } from "@/lib/content-labels";
import { SITE } from "@/lib/constants";

type Props = { params: Promise<{ slug: string }> };

/** Slugs absents de generateStaticParams restent accessibles (ex. rai-tahiti-vsl). */
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllInfoPratiqueSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getInfoPratiqueBySlug(slug);
  if (!item) return { title: "Fiche introuvable" };
  return {
    title: `${item.title} — Info pratique Moorea`,
    description: item.description,
    alternates: { canonical: `/infos-pratiques/${item.slug}` },
    openGraph: { title: item.title, description: item.description },
  };
}

export default async function InfoPratiqueDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getInfoPratiqueBySlug(slug);
  if (!item) notFound();

  const shareUrl = `${SITE.url}/infos-pratiques/${item.slug}`;

  return (
    <article>
      <ContentCoverImage
        src={item.image}
        alt={item.title}
        category={item.category}
        slug={item.slug}
        className="relative h-48 sm:h-56"
        sizes="100vw"
        priority
      />
      <section className="relative overflow-hidden bg-gradient-to-b from-ocean-100 via-lagon-50 to-white">
        <Container className="relative py-12 sm:py-16">
          <Link
            href="/infos-pratiques"
            className="inline-flex items-center gap-2 text-sm text-ocean-600 hover:text-tiare-600 mb-6"
          >
            <ArrowLeft size={16} />
            Infos pratiques
          </Link>
          <Badge variant="ocean">{INFO_CATEGORY_LABELS[item.category]}</Badge>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl text-ocean-950 text-balance">
            {item.title}
          </h1>
          <p className="mt-4 text-xl text-ocean-700 max-w-2xl text-pretty">
            {item.description}
          </p>
        </Container>
      </section>

      <Container size="narrow" className="py-12 sm:py-16">
        <div className="rounded-2xl border border-ocean-100 bg-white p-6 sm:p-8 space-y-4 shadow-[var(--shadow-soft)]">
          {item.address && (
            <p className="flex items-start gap-3 text-ocean-800">
              <MapPin size={18} className="text-lagon-600 flex-shrink-0 mt-0.5" />
              <span>{item.address}</span>
            </p>
          )}
          {item.phone && (
            <p className="flex items-center gap-3">
              <Phone size={18} className="text-tiare-600" />
              <a
                href={`tel:${item.phone.replace(/\D/g, "")}`}
                className="text-xl font-semibold text-tiare-600 hover:text-tiare-700"
              >
                {item.phone}
              </a>
            </p>
          )}
          {item.hours && (
            <p className="flex items-start gap-3 text-ocean-800">
              <Clock size={18} className="text-ocean-500 flex-shrink-0 mt-0.5" />
              <span>{item.hours}</span>
            </p>
          )}
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-ocean-700 font-semibold hover:text-tiare-600"
            >
              <ExternalLink size={18} />
              Site web
            </a>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-ocean-100">
          <ShareButtons
            url={shareUrl}
            title={item.title}
            description={item.description}
          />
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: item.title,
              description: item.description,
              address: item.address,
              telephone: item.phone,
              url: item.website,
            }),
          }}
        />
      </Container>
    </article>
  );
}
