import Link from "next/link";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import {
  accommodationTypeLabel,
  availabilityLabel,
  type Accommodation,
} from "@/lib/accommodations";

const AVAIL_STYLE: Record<
  Accommodation["availabilityStatus"],
  string
> = {
  available: "bg-lagon-100 text-lagon-800",
  limited: "bg-soleil-100 text-soleil-800",
  contact: "bg-ocean-100 text-ocean-700",
  full: "bg-ocean-200 text-ocean-600",
};

export function AccommodationsList({
  items,
}: {
  items: Accommodation[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ocean-600">
        Aucun hébergement listé — consultez les{" "}
        <Link href="/annonces" className="text-lagon-700 font-semibold hover:underline">
          annonces location
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((a) => (
        <li
          key={`${a.source}-${a.slug}`}
          className="bg-white rounded-2xl border border-ocean-100 p-4 hover:border-lagon-200 transition-colors"
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ocean-500">
              {accommodationTypeLabel(a.type)}
            </span>
            {a.featured && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-tiare-100 text-tiare-700">
                À la une
              </span>
            )}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${AVAIL_STYLE[a.availabilityStatus]}`}
            >
              {availabilityLabel(a.availabilityStatus)}
            </span>
          </div>
          <h3 className="font-semibold text-ocean-900">{a.name}</h3>
          <p className="mt-1 text-sm text-ocean-600 line-clamp-2">{a.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-ocean-500">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {a.district}
            </span>
            {a.price && <span>{a.price}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {a.href?.startsWith("http") ? (
              <a
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-lagon-700 font-semibold hover:underline"
              >
                Site web <ExternalLink size={12} />
              </a>
            ) : a.href ? (
              <Link
                href={a.href}
                className="text-lagon-700 font-semibold hover:underline"
              >
                Voir l&apos;annonce →
              </Link>
            ) : null}
            <span className="flex items-center gap-1 text-ocean-600">
              <Phone size={12} />
              {a.contact}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
