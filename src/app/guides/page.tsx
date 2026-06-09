import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { staticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = staticPageMetadata({
  title: "Guides Moorea",
  description:
    "Guides pratiques : ferry Tahiti–Moorea, 48h sur l'île, infos essentielles.",
  path: "/guides",
});

const GUIDES = [
  {
    href: "/guides/ferry-tahiti-moorea",
    title: "Ferry Tahiti ↔ Moorea",
    description: "Compagnies, horaires, conseils embarquement et billets.",
  },
  {
    href: "/guides/48h-moorea",
    title: "48h à Moorea",
    description: "Parcours famille, plongée et budget pour un week-end.",
  },
];

export default function GuidesPage() {
  return (
    <>
      <PageHeader
        badge="Guides"
        title="Guides pratiques Moorea"
        description="Contenus permanents — le détail et l'actualité sur MooreaNews."
        variant="lagon"
      />
      <Container className="py-12">
        <ul className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="block p-6 rounded-2xl bg-white border border-ocean-100 hover:border-lagon-300 hover:shadow-[var(--shadow-soft)] transition-all"
              >
                <BookOpen size={20} className="text-lagon-600 mb-3" />
                <h2 className="font-display text-xl text-ocean-900">{g.title}</h2>
                <p className="mt-2 text-sm text-ocean-600">{g.description}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-lagon-700">
                  Lire le guide <ArrowRight size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
