import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Calendar, Tag, FileCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Admin — Moorea Hub",
  robots: { index: false, follow: false },
};

export default function AdminHome() {
  return (
    <Container className="py-16">
      <div className="rounded-3xl bg-gradient-to-br from-ocean-100 to-lagon-100 p-8 sm:p-12 border border-ocean-200">
        <h1 className="font-display text-3xl sm:text-4xl text-ocean-950">
          Espace d&apos;administration
        </h1>
        <p className="mt-3 text-ocean-700 max-w-2xl">
          Interface de modération et de publication. Authentification requise.
          Connectez Supabase Auth en Phase 2 pour activer cet espace.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-2xl">
          <AdminCard
            href="/admin/articles"
            icon={<Newspaper size={20} />}
            title="Articles"
            description="Rédiger et publier des articles"
          />
          <AdminCard
            href="/admin/events"
            icon={<Calendar size={20} />}
            title="Événements"
            description="Gérer l'agenda des événements"
          />
          <AdminCard
            href="/admin/submissions"
            icon={<FileCheck size={20} />}
            title="Soumissions"
            description="Modérer les contenus envoyés"
          />
          <AdminCard
            href="/admin/announcements"
            icon={<Tag size={20} />}
            title="Annonces"
            description="Gérer les petites annonces"
          />
        </div>
      </div>
    </Container>
  );
}

function AdminCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-5 border border-ocean-100 hover:border-tiare-300 transition-colors"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lagon-500 to-ocean-700 text-white flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-display text-lg text-ocean-900">{title}</h2>
      </div>
      <p className="text-sm text-ocean-600">{description}</p>
    </Link>
  );
}
