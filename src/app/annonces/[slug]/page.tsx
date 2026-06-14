import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShareButtons } from "@/components/ShareButtons";
import { getAnnouncementBySlug, getAnnouncements } from "@/lib/content";
import { ANNOUNCEMENT_TYPE_LABELS } from "@/lib/content-labels";
import { SITE } from "@/lib/constants";
import { buildPageShareMetadata } from "@/lib/seo";
import { timeAgo } from "@/lib/utils";
import { BoostAnnouncementButton } from "@/components/commerce/BoostAnnouncementButton";
import { PosterImage } from "@/components/PosterImage";
import { hasPoster } from "@/lib/has-poster";

function ogImageUrl(item: { image?: string }) {
  return hasPoster(item.image) ? item.image!.trim() : undefined;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const items = await getAnnouncements();
  return items.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getAnnouncementBySlug(slug);
  if (!item) return { title: "Annonce introuvable" };
  return buildPageShareMetadata({
    title: item.title,
    description: item.body.slice(0, 160),
    path: `/annonces/${item.slug}`,
    imageUrl: ogImageUrl(item),
  });
}

export default async function AnnonceDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getAnnouncementBySlug(slug);
  if (!item) notFound();

  const typeMeta = ANNOUNCEMENT_TYPE_LABELS[item.type];
  const shareUrl = `${SITE.url}/annonces/${item.slug}`;
  const contactHref = item.contact.includes("@")
    ? `mailto:${item.contact}`
    : `tel:${item.contact.replace(/\s+/g, "")}`;

  return (
    <article>
      <section className="relative overflow-hidden bg-gradient-to-b from-soleil-100 via-ocean-50 to-white">
        <Container className="relative py-12 sm:py-16">
          <Link
            href="/annonces"
            className="inline-flex items-center gap-2 text-sm text-ocean-600 hover:text-tiare-600 mb-6"
          >
            <ArrowLeft size={16} />
            Toutes les annonces
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant={typeMeta.variant}>{typeMeta.label}</Badge>
            {item.price && (
              <span className="text-lg font-bold text-tiare-600">{item.price}</span>
            )}
            {item.boosted && (
              <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-soleil-400 text-white">
                Boost
              </span>
            )}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-ocean-950 text-balance">
            {item.title}
          </h1>
          {hasPoster(item.image) ? (
            <PosterImage
              src={item.image!}
              alt={`Affiche — ${item.title}`}
              className="mt-6 w-full max-w-md aspect-[3/4]"
            />
          ) : null}
          <p className="mt-4 text-sm text-ocean-600 flex items-center gap-2">
            <Calendar size={14} />
            Publiée {timeAgo(item.publishedAt)}
          </p>
        </Container>
      </section>

      <Container size="narrow" className="py-12 sm:py-16">
        <div className="prose-tropical">
          {item.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-lg leading-relaxed text-ocean-900 mb-6">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-ocean-100 bg-ocean-50/50 p-6 space-y-3">
          {item.district && (
            <p className="flex items-center gap-2 text-ocean-800">
              <MapPin size={16} className="text-tiare-600" />
              {item.district}
            </p>
          )}
          <p className="flex items-center gap-2 text-ocean-800">
            <Phone size={16} className="text-tiare-600" />
            <a href={contactHref} className="font-semibold hover:text-tiare-600">
              {item.contact}
            </a>
          </p>
        </div>

        <div className="mt-10 pt-8 border-t border-ocean-100">
          <ShareButtons url={shareUrl} title={item.title} description={item.body} />
        </div>

        <BoostAnnouncementButton announcementId={item.slug} />
      </Container>

      {/* JSON-LD (Annonce) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Offer",
            name: item.title,
            description: item.body,
            url: shareUrl,
            areaServed: "Moorea",
            availability: "https://schema.org/InStock",
            price: item.price || undefined,
          }),
        }}
      />
    </article>
  );
}
