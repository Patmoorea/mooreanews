"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AccommodationsList } from "@/components/visiteurs/AccommodationsList";
import {
  accommodationTypeLabel,
  type Accommodation,
  type AccommodationType,
} from "@/lib/accommodation-labels";

const TYPE_FILTERS: { value: AccommodationType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pension", label: "Pensions" },
  { value: "hotel", label: "Hôtels" },
  { value: "fare", label: "Fares" },
  { value: "villa", label: "Villas" },
];

function isType(value: string | null): value is AccommodationType {
  return TYPE_FILTERS.some((f) => f.value === value && f.value !== "all");
}

function DirectoryBody({
  items,
  pensionCount,
  typeFilter,
}: {
  items: Accommodation[];
  pensionCount: number;
  typeFilter: AccommodationType | null;
}) {
  const shown = typeFilter ? items.filter((a) => a.type === typeFilter) : items;

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => {
          const active = (typeFilter ?? "all") === f.value;
          const href = f.value === "all" ? "/hebergements" : `/hebergements?type=${f.value}`;
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
          {shown.length} {accommodationTypeLabel(typeFilter).toLowerCase()}
          {shown.length > 1 ? "s" : ""} listé{shown.length > 1 ? "s" : ""}.
        </p>
      )}

      <AccommodationsList items={shown} />
    </>
  );
}

function Filtered({
  items,
  pensionCount,
}: {
  items: Accommodation[];
  pensionCount: number;
}) {
  const params = useSearchParams();
  const raw = params.get("type");
  const typeFilter = isType(raw) ? raw : null;
  return (
    <DirectoryBody items={items} pensionCount={pensionCount} typeFilter={typeFilter} />
  );
}

export function HebergementsDirectory({ items }: { items: Accommodation[] }) {
  const pensionCount = items.filter((a) => a.type === "pension").length;
  return (
    <Suspense
      fallback={
        <DirectoryBody items={items} pensionCount={pensionCount} typeFilter={null} />
      }
    >
      <Filtered items={items} pensionCount={pensionCount} />
    </Suspense>
  );
}
