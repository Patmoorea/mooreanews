import type { Metadata } from "next";
import Link from "next/link";
import {
  Heart,
  Bus,
  Building2,
  ShoppingBag,
  AlertCircle,
  GraduationCap,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { CommunityLinks } from "@/components/CommunityLinks";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { getInfoPratiques } from "@/lib/content";
import type { InfoPratique } from "@/lib/content-types";

export const metadata: Metadata = {
  title: "Infos pratiques — Moorea",
  description:
    "Tous les numéros et adresses utiles : mairie, hôpital, pompiers, gendarmerie, écoles, transports (RAI TAHITI VSL, ferries), EDT, eau.",
  alternates: { canonical: "/infos-pratiques" },
};

const CATEGORY_META: Record<
  InfoPratique["category"],
  { label: string; icon: LucideIcon; color: string }
> = {
  sante: { label: "Santé", icon: Heart, color: "from-tiare-400 to-tiare-600" },
  transport: {
    label: "Transports",
    icon: Bus,
    color: "from-lagon-400 to-ocean-600",
  },
  administration: {
    label: "Administration",
    icon: Building2,
    color: "from-ocean-500 to-ocean-800",
  },
  commerce: {
    label: "Commerces",
    icon: ShoppingBag,
    color: "from-soleil-400 to-couchant",
  },
  urgence: {
    label: "Urgences",
    icon: AlertCircle,
    color: "from-tiare-500 to-tiare-700",
  },
  education: {
    label: "Éducation",
    icon: GraduationCap,
    color: "from-tipanier-400 to-tipanier-700",
  },
};

export default async function InfosPratiquesPage() {
  const items = await getInfoPratiques();
  const transportItems = items.filter((i) => i.category === "transport");
  const byCategory = new Map<InfoPratique["category"], InfoPratique[]>();
  for (const it of items) {
    const list = byCategory.get(it.category) ?? [];
    list.push(it);
    byCategory.set(it.category, list);
  }

  return (
    <>
      <PageHeader
        badge="Numéros utiles"
        title="Infos pratiques"
        description="Mairie, hôpital, urgences, transports (RAI TAHITI VSL, ferries, aérodrome), écoles, EDT, eau, poste."
        variant="ocean"
      />
      <Container className="py-12 sm:py-16">
        {transportItems.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
              <Bus size={24} className="text-lagon-600" />
              Transports — accès rapide
            </h2>
            <p className="mt-1 text-sm text-ocean-600">
              Ferries, ambulance VSL RAI TAHITI et vols inter-îles.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {transportItems.map((info) => (
                <Link
                  key={info.slug}
                  href={`/infos-pratiques/${info.slug}`}
                  className="group block bg-white rounded-2xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-all"
                >
                  <ContentCoverImage
                    src={info.image}
                    alt={info.title}
                    category={info.category}
                    slug={info.slug}
                    className="aspect-[16/9]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-ocean-900 group-hover:text-tiare-600">
                      {info.title}
                    </h3>
                    <p className="mt-1 text-sm text-ocean-700 line-clamp-2">
                      {info.description}
                    </p>
                    {info.phone && (
                      <p className="mt-2 text-sm font-semibold text-tiare-600">
                        {info.phone}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from(byCategory.entries()).map(([cat, list]) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            return (
              <section
                key={cat}
                className="bg-white rounded-2xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)]"
              >
                <header
                  className={`px-5 py-4 bg-gradient-to-r ${meta.color} text-white flex items-center gap-3`}
                >
                  <Icon size={22} />
                  <h2 className="font-display text-xl">{meta.label}</h2>
                  <span className="ml-auto text-xs opacity-80">
                    {list.length} contact{list.length > 1 ? "s" : ""}
                  </span>
                </header>
                <ul className="divide-y divide-ocean-100">
                  {list.map((info) => (
                    <li key={info.slug}>
                      <Link
                        href={`/infos-pratiques/${info.slug}`}
                        className="flex gap-4 p-4 sm:p-5 hover:bg-ocean-50/60 transition-colors"
                      >
                        <ContentCoverImage
                          src={info.image}
                          alt=""
                          category={info.category}
                          slug={info.slug}
                          className="w-24 sm:w-28 h-20 sm:h-24 rounded-xl flex-shrink-0"
                          sizes="112px"
                          overlay={false}
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-ocean-900 hover:text-tiare-600">
                            {info.title}
                          </h3>
                          <p className="text-sm text-ocean-700 mt-0.5 line-clamp-2">
                            {info.description}
                          </p>
                          <div className="mt-2 space-y-1 text-xs text-ocean-600">
                            {info.address && (
                              <p className="flex items-center gap-1.5">
                                <MapPin size={12} className="shrink-0" />
                                <span className="truncate">{info.address}</span>
                              </p>
                            )}
                            {info.phone && (
                              <p className="flex items-center gap-1.5">
                                <Phone size={12} className="shrink-0" />
                                <span className="font-semibold text-tiare-600">
                                  {info.phone}
                                </span>
                              </p>
                            )}
                            {info.hours && (
                              <p className="flex items-center gap-1.5">
                                <Clock size={12} className="shrink-0" />
                                <span className="line-clamp-1">{info.hours}</span>
                              </p>
                            )}
                            {info.website && (
                              <span className="inline-flex items-center gap-1 text-ocean-700">
                                <ExternalLink size={12} />
                                Site web
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        <CommunityLinks />
      </Container>
    </>
  );
}
