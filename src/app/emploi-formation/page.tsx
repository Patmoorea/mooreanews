import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  ExternalLink,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import {
  getSefiLastSyncAt,
  getSefiMooreaJobs,
  getSefiMooreaTrainings,
} from "@/lib/sefi-listings";
import {
  SEFI_MOOREA_ANTENNE,
  SEFI_MOOREA_JOBS_SEARCH_URL,
  SEFI_PUBLIC_JOB_SEARCH_URL,
  SEFI_SITE_BASE,
} from "@/lib/sefi-sources";
import { formatDateShortFR, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Emploi & formation — Moorea",
  description:
    "Offres d'emploi et formations SEFI à Moorea : veille quotidienne sur services.sefi.pf et actualités formation.",
  alternates: { canonical: "/emploi-formation" },
};

export const dynamic = "force-dynamic";

export default async function EmploiFormationPage() {
  const [jobs, trainings, lastSync] = await Promise.all([
    getSefiMooreaJobs(),
    getSefiMooreaTrainings(),
    getSefiLastSyncAt(),
  ]);

  return (
    <>
      <PageHeader
        badge="SEFI · Moorea"
        title="Emploi & formation"
        description="Offres d'emploi et dispositifs de formation recensés pour l'île — mise à jour automatique chaque jour depuis le SEFI."
        variant="ocean"
      />

      <Container className="py-10 sm:py-14 space-y-12">
        <div className="flex flex-wrap items-center gap-3 text-sm text-ocean-600">
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={14} aria-hidden />
            {lastSync
              ? `Dernière synchronisation : ${timeAgo(lastSync)}`
              : "Synchronisation en attente (cron quotidien)"}
          </span>
          <span className="text-ocean-300">·</span>
          <span>
            Source officielle :{" "}
            <a
              href={SEFI_SITE_BASE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tiare-600 font-semibold hover:underline"
            >
              sefi.pf
            </a>
          </span>
        </div>

        {/* Antenne */}
        <section className="rounded-3xl border border-ocean-100 bg-gradient-to-br from-lagon-50 to-white p-6 sm:p-8 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
            <MapPin size={22} className="text-lagon-600" aria-hidden />
            {SEFI_MOOREA_ANTENNE.title}
          </h2>
          <p className="mt-2 text-ocean-700">{SEFI_MOOREA_ANTENNE.address}</p>
          <ul className="mt-4 space-y-2 text-sm text-ocean-700">
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-lagon-600 shrink-0" />
              <a
                href={`tel:${SEFI_MOOREA_ANTENNE.phone.replace(/\s/g, "")}`}
                className="hover:text-tiare-600"
              >
                {SEFI_MOOREA_ANTENNE.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-lagon-600 shrink-0" />
              <a
                href={`mailto:${SEFI_MOOREA_ANTENNE.email}`}
                className="hover:text-tiare-600"
              >
                {SEFI_MOOREA_ANTENNE.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={14} className="text-lagon-600 shrink-0 mt-0.5" />
              {SEFI_MOOREA_ANTENNE.hours}
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={SEFI_PUBLIC_JOB_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ocean-900 text-white text-sm font-semibold hover:bg-ocean-800 transition-colors"
            >
              Rechercher sur SEFI
              <ExternalLink size={14} />
            </a>
            <a
              href={SEFI_MOOREA_JOBS_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-ocean-200 text-ocean-800 text-sm font-semibold hover:border-tiare-300 transition-colors"
            >
              Offres île Moorea (lien direct)
              <ExternalLink size={14} />
            </a>
          </div>
        </section>

        {/* Offres */}
        <section id="offres">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tiare-100 text-tiare-800 text-xs font-semibold uppercase tracking-widest">
                <Briefcase size={12} />
                Emploi
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ocean-950">
                Offres à Moorea
              </h2>
              <p className="mt-1 text-sm text-ocean-600">
                {jobs.length} offre{jobs.length !== 1 ? "s" : ""} recensée
                {jobs.length !== 1 ? "s" : ""} — critère île MOOREA (SEFI).
              </p>
            </div>
          </div>

          {jobs.length === 0 ? (
            <EmptyBlock
              message="Aucune offre en base pour l'instant. La prochaine synchronisation quotidienne importera les postes publiés sur services.sefi.pf."
              href={SEFI_MOOREA_JOBS_SEARCH_URL}
              linkLabel="Voir les offres Moorea sur SEFI"
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <li key={job.id}>
                  <ListingCard
                    href={job.url}
                    title={job.title}
                    excerpt={job.excerpt}
                    date={job.publishedAt}
                    badge="Offre"
                    badgeVariant="tiare"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Formations */}
        <section id="formations">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lagon-100 text-lagon-800 text-xs font-semibold uppercase tracking-widest">
              <GraduationCap size={12} />
              Formation
            </span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ocean-950">
              Formations & ateliers (Moorea)
            </h2>
            <p className="mt-1 text-sm text-ocean-600">
              Pages SEFI mentionnant Moorea (CGE, EPIP, ateliers…).
            </p>
          </div>

          {trainings.length === 0 ? (
            <EmptyBlock
              message="Aucune formation Moorea indexée pour le moment."
              href={`${SEFI_SITE_BASE}/actualites/`}
              linkLabel="Actualités SEFI"
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trainings.map((t) => (
                <li key={t.id}>
                  <ListingCard
                    href={t.url}
                    title={t.title}
                    excerpt={t.excerpt}
                    date={t.publishedAt}
                    badge="Formation"
                    badgeVariant="lagon"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-ocean-500 max-w-3xl">
          MooreaNews reprend les titres et liens publics du{" "}
          <strong>Service de l&apos;emploi, de la formation et de l&apos;insertion professionnelles</strong>{" "}
          (SEFI). Pour postuler ou vous inscrire, utilisez toujours le site officiel SEFI.
          Les annonces locales restent aussi disponibles dans{" "}
          <Link href="/annonces" className="text-tiare-600 font-semibold hover:underline">
            les petites annonces
          </Link>
          .
        </p>
      </Container>
    </>
  );
}

function ListingCard({
  href,
  title,
  excerpt,
  date,
  badge,
  badgeVariant,
}: {
  href: string;
  title: string;
  excerpt: string | null;
  date: string;
  badge: string;
  badgeVariant: "tiare" | "lagon";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col h-full p-5 bg-white rounded-2xl border border-ocean-100 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge variant={badgeVariant}>{badge}</Badge>
        <time className="text-[10px] text-ocean-500">
          {formatDateShortFR(date)}
        </time>
      </div>
      <h3 className="font-display text-lg text-ocean-900 leading-snug group-hover:text-tiare-600 transition-colors flex-1">
        {title}
      </h3>
      {excerpt ? (
        <p className="mt-2 text-sm text-ocean-600 line-clamp-2">{excerpt}</p>
      ) : null}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-lagon-700">
        Voir sur SEFI
        <ExternalLink size={12} />
      </span>
    </a>
  );
}

function EmptyBlock({
  message,
  href,
  linkLabel,
}: {
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ocean-200 bg-ocean-50/50 p-8 text-center">
      <p className="text-ocean-700">{message}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-tiare-600 hover:underline"
      >
        {linkLabel}
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
