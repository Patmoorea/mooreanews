import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Clock,
  RefreshCw,
  Landmark,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import {
  getAravihiMooreaJobs,
  getCgfMooreaJobs,
  getCommuneEmploymentPosts,
  getEmploymentLastSyncAt,
  getSefiMooreaJobs,
  getSefiMooreaTrainings,
  type EmploymentListing,
} from "@/lib/employment-listings";
import {
  ARAVIHI_MOOREA_SEARCH_URL,
  CGF_OFFERS_URL,
  COMMUNE_RECRUTE_URL,
  EMPLOYMENT_EXTERNAL_LINKS,
  SEFI_MOOREA_ANTENNE,
  SEFI_MOOREA_JOBS_SEARCH_URL,
  SEFI_PUBLIC_JOB_SEARCH_URL,
} from "@/lib/employment-sources";
import { formatDateShortFR, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Emploi & formation — Moorea",
  description:
    "Offres SEFI, Aravihi, CGF, commune et formations à Moorea — mise à jour quotidienne.",
  alternates: { canonical: "/emploi-formation" },
};

export const revalidate = 1800;

export default async function EmploiFormationPage() {
  const [sefiJobs, aravihiJobs, cgfJobs, communePosts, trainings, lastSync] =
    await Promise.all([
      getSefiMooreaJobs(),
      getAravihiMooreaJobs(),
      getCgfMooreaJobs(),
      getCommuneEmploymentPosts(),
      getSefiMooreaTrainings(),
      getEmploymentLastSyncAt(),
    ]);

  const totalJobs =
    sefiJobs.length + aravihiJobs.length + cgfJobs.length + communePosts.length;

  return (
    <>
      <PageHeader
        badge="Moorea · Quotidien"
        title="Emploi & formation"
        description="Offres et formations recensées pour l'île — SEFI, administration du Pays, communes et sources officielles."
        variant="ocean"
      />

      <Container className="py-10 sm:py-14 space-y-12">
        <div className="flex flex-wrap items-center gap-3 text-sm text-ocean-600">
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={14} aria-hidden />
            {lastSync
              ? `Dernière synchro : ${timeAgo(lastSync)}`
              : "Synchro quotidienne (cron) en attente"}
          </span>
          <span className="text-ocean-300">·</span>
          <span>
            {totalJobs} offre{totalJobs !== 1 ? "s" : ""} indexée
            {totalJobs !== 1 ? "s" : ""} · {trainings.length} formation
            {trainings.length !== 1 ? "s" : ""}
          </span>
        </div>

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
        </section>

        <JobSection
          id="sefi"
          icon={Briefcase}
          badgeLabel="SEFI"
          badgeVariant="tiare"
          title="Emploi — secteur privé (SEFI)"
          description="Offres sur l'île MOOREA via services.sefi.pf."
          items={sefiJobs}
          emptyMessage="Aucune offre SEFI en base pour l'instant."
          emptyHref={SEFI_MOOREA_JOBS_SEARCH_URL}
          emptyLinkLabel="Voir les offres Moorea sur SEFI"
          ctaLabel="SEFI"
        />

        <JobSection
          id="aravihi"
          icon={Landmark}
          badgeLabel="Aravihi"
          badgeVariant="ocean"
          title="Emploi — administration du Pays"
          description="Fonction publique de la Polynésie française (Moorea)."
          items={aravihiJobs}
          emptyMessage="Aucune offre Aravihi indexée pour l'instant."
          emptyHref={ARAVIHI_MOOREA_SEARCH_URL}
          emptyLinkLabel="Toutes les offres Moorea sur Aravihi"
          ctaLabel="Aravihi"
        />

        <JobSection
          id="cgf"
          icon={Building2}
          badgeLabel="CGF"
          badgeVariant="lagon"
          title="Emploi — communes & EPA (CGF)"
          description="Moorea-Maiao, Te Ito Rau no Moorea-Maiao."
          items={cgfJobs}
          emptyMessage="Aucune offre CGF Moorea publiée pour le moment sur cgf.pf."
          emptyHref={CGF_OFFERS_URL}
          emptyLinkLabel="Parcourir toutes les offres CGF"
          ctaLabel="CGF"
        />

        <JobSection
          id="commune"
          icon={Building2}
          badgeLabel="Commune"
          badgeVariant="soleil"
          title="Commune de Moorea-Maiao"
          description="Actualités et avis liés au recrutement communal (flux RSS)."
          items={communePosts}
          emptyMessage="Pas d'annonce emploi récente dans le flux communal."
          emptyHref={COMMUNE_RECRUTE_URL}
          emptyLinkLabel="Page « La commune recrute »"
          ctaLabel="Commune"
        />

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
              href={SEFI_PUBLIC_JOB_SEARCH_URL}
              linkLabel="Portail SEFI"
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trainings.map((t) => (
                <li key={t.id}>
                  <ListingCard item={t} ctaLabel="SEFI" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-ocean-100 bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl text-ocean-950">
            Toutes les sources officielles
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Liens utiles complémentaires (consultation directe sur les sites
            sources).
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {EMPLOYMENT_EXTERNAL_LINKS.map((link) => (
              <li key={link.href}>
                {"internal" in link && link.internal ? (
                  <Link
                    href={link.href}
                    className="flex flex-col p-4 rounded-2xl border border-ocean-100 hover:border-tiare-300 hover:shadow-sm transition-all h-full"
                  >
                    <span className="font-semibold text-ocean-900">
                      {link.title}
                    </span>
                    <span className="mt-1 text-sm text-ocean-600">
                      {link.description}
                    </span>
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col p-4 rounded-2xl border border-ocean-100 hover:border-tiare-300 hover:shadow-sm transition-all h-full group"
                  >
                    <span className="font-semibold text-ocean-900 group-hover:text-tiare-600 flex items-center gap-2">
                      {link.title}
                      <ExternalLink size={14} className="shrink-0" />
                    </span>
                    <span className="mt-1 text-sm text-ocean-600">
                      {link.description}
                    </span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-ocean-500 max-w-3xl">
          MooreaNews agrège des informations publiques (SEFI, Aravihi, CGF,
          commune). Pour candidater, utilisez toujours le site officiel de
          l&apos;employeur. Annonces locales :{" "}
          <Link
            href="/annonces"
            className="text-tiare-600 font-semibold hover:underline"
          >
            petites annonces
          </Link>
          .
        </p>
      </Container>
    </>
  );
}

function JobSection({
  id,
  icon: Icon,
  badgeLabel,
  badgeVariant,
  title,
  description,
  items,
  emptyMessage,
  emptyHref,
  emptyLinkLabel,
  ctaLabel,
}: {
  id: string;
  icon: typeof Briefcase;
  badgeLabel: string;
  badgeVariant: "tiare" | "lagon" | "ocean" | "soleil";
  title: string;
  description: string;
  items: EmploymentListing[];
  emptyMessage: string;
  emptyHref: string;
  emptyLinkLabel: string;
  ctaLabel: string;
}) {
  return (
    <section id={id}>
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ocean-100 text-ocean-800 text-xs font-semibold uppercase tracking-widest">
          <Icon size={12} />
          {badgeLabel}
        </span>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ocean-950">
          {title}
        </h2>
        <p className="mt-1 text-sm text-ocean-600">
          {description}{" "}
          <span className="font-medium">
            ({items.length} sur MooreaNews)
          </span>
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyBlock
          message={emptyMessage}
          href={emptyHref}
          linkLabel={emptyLinkLabel}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((job) => (
            <li key={job.id}>
              <ListingCard item={job} ctaLabel={ctaLabel} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ListingCard({
  item,
  ctaLabel,
}: {
  item: EmploymentListing;
  ctaLabel: string;
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col h-full p-5 bg-white rounded-2xl border border-ocean-100 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <Badge variant="neutral" className="text-[10px]">
          {item.sourceName}
        </Badge>
        <time className="text-[10px] text-ocean-500">
          {formatDateShortFR(item.publishedAt)}
        </time>
      </div>
      <h3 className="font-display text-lg text-ocean-900 leading-snug group-hover:text-tiare-600 transition-colors flex-1">
        {item.title}
      </h3>
      {item.excerpt ? (
        <p className="mt-2 text-sm text-ocean-600 line-clamp-2">
          {item.excerpt}
        </p>
      ) : null}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-lagon-700">
        Voir sur {ctaLabel}
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
