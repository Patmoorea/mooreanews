import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, ExternalLink, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import {
  accommodationTypeLabel,
  availabilityLabel,
  getAccommodationBySlug,
} from "@/lib/accommodations";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const acc = await getAccommodationBySlug(slug);
  if (!acc) return { title: "Hébergement" };
  return {
    title: `${acc.name} — Hébergement Moorea`,
    description: acc.description,
    alternates: { canonical: `/hebergements/${slug}` },
  };
}

export default async function HebergementDetailPage({ params }: Props) {
  const { slug } = await params;
  const acc = await getAccommodationBySlug(slug);
  if (!acc) notFound();

  return (
    <Container className="py-12 sm:py-16 max-w-3xl">
      <Link
        href="/hebergements"
        className="inline-flex items-center gap-1 text-sm text-lagon-700 font-semibold hover:underline mb-6"
      >
        <ArrowLeft size={14} />
        Tous les hébergements
      </Link>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs font-semibold uppercase px-2 py-1 rounded-full bg-lagon-100 text-lagon-800">
          {accommodationTypeLabel(acc.type)}
        </span>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-ocean-100 text-ocean-700">
          {availabilityLabel(acc.availabilityStatus)}
        </span>
        {acc.featured && (
          <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-tiare-100 text-tiare-700">
            À la une
          </span>
        )}
        {acc.premium && (
          <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-soleil-100 text-soleil-800">
            Premium
          </span>
        )}
      </div>

      <h1 className="font-display text-3xl text-ocean-950">{acc.name}</h1>
      <p className="mt-2 flex items-center gap-1 text-sm text-ocean-600">
        <MapPin size={14} />
        {acc.district}
        {acc.priceHint && ` · ${acc.priceHint}`}
      </p>

      <p className="mt-6 text-ocean-800 leading-relaxed whitespace-pre-line">
        {acc.description}
      </p>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <span className="inline-flex items-center gap-2 text-ocean-700">
          <Phone size={16} />
          {acc.contact}
        </span>
        {acc.website && (
          <a
            href={acc.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-lagon-700 font-semibold hover:underline"
          >
            Site / réserver <ExternalLink size={14} />
          </a>
        )}
      </div>

      <p className="mt-10 text-sm text-ocean-500">
        Planifiez votre séjour :{" "}
        <Link href="/mon-sejour" className="text-lagon-700 font-semibold hover:underline">
          Mon séjour
        </Link>
        {" · "}
        <Link href="/visiteurs" className="text-lagon-700 font-semibold hover:underline">
          Guide visiteurs
        </Link>
      </p>
    </Container>
  );
}
