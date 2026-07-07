import Link from "next/link";
import { Clock, MapPin, Phone, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  directionShort,
  formatPhoneDisplay,
  formatPhoneHref,
  type ParsedCarpoolOffer,
} from "@/lib/covoiturage";

type Props = {
  offers: ParsedCarpoolOffer[];
};

export function CovoiturageList({ offers }: Props) {
  if (offers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ocean-200 bg-ocean-50/50 px-6 py-12 text-center">
        <p className="text-ocean-700 font-medium">
          Aucun trajet pour le moment.
        </p>
        <p className="mt-2 text-sm text-ocean-600">
          Soyez le premier à proposer un trajet en voiture vers le quai Vaiare
          ou depuis le quai pour rentrer chez vous.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {offers.map((offer) => (
        <CarpoolCard key={offer.id} offer={offer} />
      ))}
    </ul>
  );
}

function CarpoolCard({ offer }: { offer: ParsedCarpoolOffer }) {
  const phone = offer.phone || offer.contact;
  const href = formatPhoneHref(phone);

  return (
    <li className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="lagon">
            {directionShort(offer.direction)}
            {offer.tripDate ? ` · ${formatDateFr(offer.tripDate)}` : ""}
          </Badge>
          <h3 className="mt-2 font-display text-lg font-bold text-ocean-900">
            {offer.title}
          </h3>
          <p className="mt-1 text-sm text-ocean-600">{offer.author}</p>
        </div>
        {offer.time && (
          <div className="flex items-center gap-1.5 rounded-full bg-soleil-50 px-3 py-1.5 text-sm font-bold text-soleil-800">
            <Clock className="h-4 w-4" />
            {offer.time.slice(0, 5)}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-sm text-ocean-700 sm:grid-cols-2">
        {offer.meetingPoint && (
          <p className="flex items-start gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-lagon-600 mt-0.5" />
            <span>
              <span className="font-medium">RDV</span> — {offer.meetingPoint}
            </span>
          </p>
        )}
        {offer.destination && (
          <p className="flex items-start gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-ocean-400 mt-0.5" />
            <span>
              <span className="font-medium">→</span> {offer.destination}
            </span>
          </p>
        )}
        <p className="flex items-center gap-2">
          <Users className="h-4 w-4 text-lagon-600" />
          {offer.seats} place{offer.seats > 1 ? "s" : ""}
        </p>
        {offer.priceShare && (
          <p className="text-tiare-700 font-medium">{offer.priceShare}</p>
        )}
      </div>

      {href && (
        <a
          href={href}
          className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-lagon-600 to-ocean-700 px-5 py-2.5 text-sm font-bold text-white"
        >
          <Phone className="h-4 w-4" />
          Appeler {formatPhoneDisplay(phone)}
        </a>
      )}
    </li>
  );
}

function formatDateFr(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-PF", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Pacific/Tahiti",
    });
  } catch {
    return iso;
  }
}
