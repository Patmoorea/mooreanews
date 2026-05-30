import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { AccommodationsList } from "@/components/visiteurs/AccommodationsList";
import {
  accommodationTypeLabel,
  getVisitorAccommodations,
  type AccommodationType,
} from "@/lib/accommodations";

export const dynamic = "force-dynamic";

const TYPE_FILTERS: { value: AccommodationType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pension", label: "Pensions" },
  { value: "hotel", label: "Hôtels" },
  { value: "fare", label: "Fares" },
  { value: "villa", label: "Villas" },
];

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export const metadata: Metadata = {
  title: "Hébergements à Moorea",
  description:
    "31 pensions de famille, hôtels, fares et locations à Moorea — annuaire visiteurs MooreaNews.",
  alternates: { canonical: "/hebergements" },
};

export default async function HebergementsPage({ searchParams }: Props) {
  const { type: typeParam } = await searchParams;
  const allItems = await getVisitorAccommodations();
  const typeFilter =
    typeParam && TYPE_FILTERS.some((f) => f.value === typeParam)
      ? (typeParam as AccommodationType)
      : null;
  const items = typeFilter
    ? allItems.filter((a) => a.type === typeFilter)
    : allItems;
  const pensionCount = allItems.filter((a) => a.type === "pension").length;

  return (
    <>
      <PageHeader
        badge="Dormir"
        title="Où dormir à Moorea"
        description={`${pensionCount} pensions de famille, hôtels et fares — disponibilités signalées ou sur demande.`}
        variant="lagon"
      />
      <Container className="py-12 sm:py-16">
        <p className="mb-6 text-sm text-ocean-600">
          <Link href="/visiteurs" className="font-semibold text-lagon-700 hover:underline">
            ← Guide visiteurs
          </Link>
          {" · "}
          <Link href="/annonces" className="font-semibold text-lagon-700 hover:underline">
            Annonces location
          </Link>
        </p>

        <div className="mb-8 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => {
            const active = (typeFilter ?? "all") === f.value;
            const href =
              f.value === "all" ? "/hebergements" : `/hebergements?type=${f.value}`;
            return (
              <Link
                key={f.value}
                href={href}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-lagon-600 text-white"
                    : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
                }`}
              >
                {f.label}
                {f.value === "pension" ? ` (${pensionCount})` : ""}
              </Link>
            );
          })}
        </div>

        {typeFilter && (
          <p className="mb-6 text-sm text-ocean-600">
            {items.length} {accommodationTypeLabel(typeFilter).toLowerCase()}
            {items.length > 1 ? "s" : ""} listé{items.length > 1 ? "s" : ""}.
          </p>
        )}

        <AccommodationsList items={items} />
      </Container>
    </>
  );
}
