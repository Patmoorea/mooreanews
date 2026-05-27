import type { Metadata } from "next";
import Link from "next/link";
import {
  Newspaper,
  Calendar,
  Megaphone,
  UtensilsCrossed,
  Mountain,
  Inbox,
  Mail,
  Rss,
  ExternalLink,
} from "lucide-react";
import { dbGetAdminStats } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function AdminDashboard() {
  const stats = await dbGetAdminStats();

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-ocean-950">
          Tableau de bord
        </h1>
        <p className="mt-2 text-ocean-600">
          Vue d&apos;ensemble du contenu et des contributions.
        </p>
      </header>

      {!isSupabaseConfigured() && <SupabaseSetupNotice />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Articles publiés"
          value={stats?.articles ?? "—"}
          icon={<Newspaper size={20} />}
          href="/admin/articles"
          color="from-lagon-500 to-ocean-600"
        />
        <StatCard
          label="Événements"
          value={stats?.events ?? "—"}
          icon={<Calendar size={20} />}
          href="/admin/events"
          color="from-tiare-400 to-tiare-600"
        />
        <StatCard
          label="Annonces"
          value={stats?.announcements ?? "—"}
          icon={<Megaphone size={20} />}
          href="/admin/announcements"
          color="from-soleil-400 to-soleil-600"
        />
        <StatCard
          label="Restaurants"
          value={stats?.restaurants ?? "—"}
          icon={<UtensilsCrossed size={20} />}
          href="/admin/restaurants"
          color="from-couchant to-corail"
        />
        <StatCard
          label="Activités"
          value={stats?.activities ?? "—"}
          icon={<Mountain size={20} />}
          href="/admin/activities"
          color="from-tipanier-400 to-tipanier-600"
        />
        <StatCard
          label="Inscrits newsletter"
          value={stats?.newsletterSubscribers ?? "—"}
          icon={<Mail size={20} />}
          href="/admin/newsletter"
          color="from-ocean-500 to-ocean-700"
        />
      </div>

      {/* Soumissions en attente — mis en avant */}
      <Link
        href="/admin/submissions"
        className="mt-6 block rounded-3xl bg-gradient-to-br from-tiare-500 to-couchant p-6 text-white shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Inbox size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-80">
                À modérer
              </p>
              <p className="font-display text-3xl leading-none mt-1">
                {stats?.pendingSubmissions ?? "—"} soumission
                {(stats?.pendingSubmissions ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <ExternalLink size={20} className="opacity-80" />
        </div>
      </Link>

      <section className="mt-10 bg-white rounded-3xl border border-ocean-100 p-6">
        <h2 className="font-display text-xl text-ocean-900 mb-3">
          Actions rapides
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction
            href="/admin/articles/new"
            label="Nouvel article"
            icon={<Newspaper size={16} />}
          />
          <QuickAction
            href="/admin/events/new"
            label="Nouvel événement"
            icon={<Calendar size={16} />}
          />
          <QuickAction
            href="/admin/announcements/new"
            label="Nouvelle annonce"
            icon={<Megaphone size={16} />}
          />
          <QuickAction
            href="/admin/restaurants/new"
            label="Nouveau restaurant"
            icon={<UtensilsCrossed size={16} />}
          />
          <QuickAction
            href="/admin/activities/new"
            label="Nouvelle activité"
            icon={<Mountain size={16} />}
          />
          <QuickAction
            href="/admin/submissions"
            label="Voir les soumissions"
            icon={<Inbox size={16} />}
          />
          <QuickAction
            href="/admin/external"
            label="Veille RSS"
            icon={<Rss size={16} />}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-ocean-100 p-5 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-ocean-500 font-semibold">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 font-display text-4xl text-ocean-950 leading-none">
        {value}
      </p>
    </Link>
  );
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-ocean-50 hover:bg-tiare-50 text-ocean-800 text-sm font-medium transition-colors"
    >
      <span className="text-tiare-600">{icon}</span>
      {label}
    </Link>
  );
}

function SupabaseSetupNotice() {
  return (
    <div className="mb-6 bg-tiare-50 border border-tiare-200 rounded-2xl p-5">
      <p className="font-semibold text-tiare-800">
        Supabase n&apos;est pas encore configuré
      </p>
      <p className="mt-1 text-sm text-tiare-700">
        Les statistiques et les actions CRUD seront disponibles une fois que
        les variables d&apos;environnement seront définies. Voir le fichier{" "}
        <code className="bg-white px-1.5 py-0.5 rounded">.env.example</code>.
      </p>
    </div>
  );
}
