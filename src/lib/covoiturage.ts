/**
 * Covoiturage ferry Moorea ↔ Tahiti — offres publiées sur MooreaNews.
 */

export type CarpoolDirection =
  | "moorea-tahiti"
  | "tahiti-moorea"
  | "moorea-quai";

export const CARPOOL_DIRECTIONS: {
  value: CarpoolDirection;
  label: string;
  short: string;
}[] = [
  {
    value: "moorea-tahiti",
    label: "Moorea → Tahiti (aller au ferry)",
    short: "M → T",
  },
  {
    value: "tahiti-moorea",
    label: "Tahiti → Moorea (retour île)",
    short: "T → M",
  },
  {
    value: "moorea-quai",
    label: "Moorea → Quai Vaiare (covoiturage local)",
    short: "→ Quai",
  },
];

export const CARPOOL_MEETING_POINTS = [
  "Quai Vaiare",
  "Maharepa",
  "Afareaitu",
  "Haapiti",
  "Temae",
  "Paopao",
  "Papetoai",
  "Tiahura",
  "Autre (préciser dans le message)",
] as const;

export type CarpoolOfferInput = {
  direction: CarpoolDirection;
  tripDate: string;
  time: string;
  seats: number;
  meetingPoint: string;
  destination: string;
  priceShare?: string;
  notes?: string;
  author: string;
  phone: string;
};

export type ParsedCarpoolOffer = CarpoolOfferInput & {
  id: string;
  title: string;
  publishedAt: string;
  contact: string;
};

export function directionLabel(dir: CarpoolDirection): string {
  return CARPOOL_DIRECTIONS.find((d) => d.value === dir)?.label ?? dir;
}

export function directionShort(dir: CarpoolDirection): string {
  return CARPOOL_DIRECTIONS.find((d) => d.value === dir)?.short ?? dir;
}

export function buildCarpoolTitle(input: CarpoolOfferInput): string {
  const short = directionShort(input.direction);
  const time = input.time.slice(0, 5);
  const place = input.meetingPoint.split("(")[0]?.trim() || input.destination;
  return `Covoiturage ${short} — ${time} — ${place}`;
}

export function buildCarpoolBody(input: CarpoolOfferInput): string {
  const lines = [
    `Sens : ${directionLabel(input.direction)}`,
    `Trajet : ${input.tripDate} à ${input.time.slice(0, 5)}`,
    `Places disponibles : ${input.seats}`,
    `Rendez-vous : ${input.meetingPoint}`,
    `Destination : ${input.destination}`,
  ];
  if (input.priceShare?.trim()) {
    lines.push(`Partage frais : ${input.priceShare.trim()}`);
  }
  if (input.notes?.trim()) {
    lines.push("", input.notes.trim());
  }
  lines.push(
    "",
    "— Publié sur MooreaNews. Contactez le conducteur par téléphone ou SMS.",
  );
  return lines.join("\n");
}

export function parseCarpoolBody(
  body: string,
): Partial<Omit<CarpoolOfferInput, "author" | "phone">> {
  const get = (re: RegExp) => body.match(re)?.[1]?.trim();
  const directionRaw = get(/Sens\s*:\s*(.+)/i);
  let direction: CarpoolDirection = "moorea-tahiti";
  if (/tahiti.*moorea/i.test(directionRaw ?? "")) {
    direction = "tahiti-moorea";
  } else if (/quai|vaiare/i.test(directionRaw ?? "")) {
    direction = "moorea-quai";
  }

  const trip = get(/Trajet\s*:\s*(\d{4}-\d{2}-\d{2})\s*à\s*(\d{1,2}:\d{2})/i);
  const seats = Number(get(/Places disponibles\s*:\s*(\d+)/i) ?? "1");

  return {
    direction,
    tripDate: trip?.[1] ?? "",
    time: trip?.[2] ?? "",
    seats: Number.isFinite(seats) && seats > 0 ? seats : 1,
    meetingPoint: get(/Rendez-vous\s*:\s*(.+)/i) ?? "",
    destination: get(/Destination\s*:\s*(.+)/i) ?? "",
    priceShare: get(/Partage frais\s*:\s*(.+)/i),
  };
}

/** Expire l’offre le lendemain du trajet (23h59 Tahiti). */
export function carpoolExpiresAt(tripDate: string): string {
  const d = new Date(`${tripDate}T23:59:00-10:00`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

export function formatPhoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-8);
  return digits.length >= 6 ? `tel:+689${digits}` : "";
}

export function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-8);
  if (d.length < 8) return phone.trim();
  return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function facebookShareUrl(pageUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
}
