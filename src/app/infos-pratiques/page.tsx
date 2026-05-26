import type { Metadata } from "next";
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
import { getInfoPratiques } from "@/lib/content";
import type { InfoPratique } from "@/lib/content-types";

export const metadata: Metadata = {
  title: "Infos pratiques — Moorea",
  description:
    "Tous les numéros et adresses utiles : mairie, hôpital, pompiers, gendarmerie, écoles, transports, EDT, eau.",
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

export default function InfosPratiquesPage() {
  const items = getInfoPratiques();
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
        description="Mairie, hôpital, urgences, transports, écoles, EDT, eau, poste — tous les contacts utiles de Moorea."
        variant="ocean"
      />
      <Container className="py-12 sm:py-16">
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
                    <li key={info.slug} className="p-5">
                      <h3 className="font-semibold text-ocean-900">
                        {info.title}
                      </h3>
                      <p className="text-sm text-ocean-700 mt-0.5">
                        {info.description}
                      </p>
                      <div className="mt-3 space-y-1.5 text-xs text-ocean-600">
                        {info.address && (
                          <p className="flex items-center gap-1.5">
                            <MapPin size={12} />
                            {info.address}
                          </p>
                        )}
                        {info.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone size={12} />
                            <a
                              href={`tel:${info.phone.replace(/\D/g, "")}`}
                              className="font-semibold text-tiare-600 hover:text-tiare-700"
                            >
                              {info.phone}
                            </a>
                          </p>
                        )}
                        {info.hours && (
                          <p className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {info.hours}
                          </p>
                        )}
                        {info.website && (
                          <a
                            href={info.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-ocean-700 hover:text-tiare-600"
                          >
                            <ExternalLink size={12} />
                            Site web
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </Container>
    </>
  );
}
