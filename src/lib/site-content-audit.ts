/**
 * Audit du contenu public MooreaNews — détecte publications suspectes
 * (vieux posts Facebook, dates passées, veille externe obsolète…).
 */

import {
  contentReferencesFacebookStaleYear,
  contentReferencesStaleYear,
  contentReferencesVeryStaleYear,
  isEmptyFacebookArticleShell,
  isFacebookJunkText,
} from "@/lib/facebook-import-filters";
import { getAdminSupabase } from "@/lib/supabase/admin";

export type ContentAuditFinding = {
  kind: "article" | "event" | "announcement" | "external";
  id: string;
  title: string;
  reason: string;
  severity: "warning" | "critical";
  adminPath: string;
};

export type ContentAuditReport = {
  scannedAt: string;
  findings: ContentAuditFinding[];
  totals: {
    articles: number;
    events: number;
    announcements: number;
    external: number;
  };
};

function stalePublicationTitle(title: string): boolean {
  return (
    /\bpublication du 20\d{2}-\d{2}-\d{2}\b/i.test(title) &&
    contentReferencesStaleYear(title)
  );
}

/** Parcourt articles / événements / annonces / veille externe publiés. */
export async function auditPublicContent(): Promise<ContentAuditReport | null> {
  const admin = getAdminSupabase();
  if (!admin) return null;

  const findings: ContentAuditFinding[] = [];
  const pastEventCutoff = new Date();
  pastEventCutoff.setDate(pastEventCutoff.getDate() - 14);
  const pastEventIso = pastEventCutoff.toISOString().slice(0, 10);

  const { data: articles } = await admin
    .from("articles")
    .select(
      "id, slug, title, excerpt, body, tags, published, published_at, cover_url",
    )
    .eq("published", true)
    .limit(500);

  for (const a of articles ?? []) {
    const isFb =
      (a.tags ?? []).includes("facebook-import") ||
      (a.slug ?? "").includes("-fb-");

    if (stalePublicationTitle(a.title)) {
      findings.push({
        kind: "article",
        id: a.id,
        title: a.title,
        reason: "Titre « publication du 20xx » — post Facebook ancien",
        severity: "critical",
        adminPath: `/admin/articles/${a.id}`,
      });
      continue;
    }

    if (isFb) {
      if (isFacebookJunkText(a.title)) {
        findings.push({
          kind: "article",
          id: a.id,
          title: a.title,
          reason: "Facebook : contenu indisponible ou lien mort",
          severity: "critical",
          adminPath: `/admin/articles/${a.id}`,
        });
        continue;
      }

      if (
        isEmptyFacebookArticleShell({
          title: a.title,
          excerpt: a.excerpt,
          body: a.body ?? "",
          cover_url: a.cover_url,
        })
      ) {
        findings.push({
          kind: "article",
          id: a.id,
          title: a.title,
          reason: "Import Facebook sans texte ni affiche (coquille vide)",
          severity: "critical",
          adminPath: `/admin/articles/${a.id}`,
        });
        continue;
      }

      const corpus = `${a.title} ${a.excerpt ?? ""} ${a.body ?? ""}`;
      if (contentReferencesFacebookStaleYear(corpus)) {
        findings.push({
          kind: "article",
          id: a.id,
          title: a.title,
          reason: "Import Facebook avec année 2024 ou plus ancienne",
          severity: "critical",
          adminPath: `/admin/articles/${a.id}`,
        });
        continue;
      }
      if (a.published_at) {
        const ageMs = Date.now() - Date.parse(a.published_at);
        if (ageMs > 90 * 24 * 60 * 60 * 1000) {
          findings.push({
            kind: "article",
            id: a.id,
            title: a.title,
            reason: "Import Facebook publié depuis plus de 90 jours",
            severity: "warning",
            adminPath: `/admin/articles/${a.id}`,
          });
        }
      }
      continue;
    }

    const headline = `${a.title} ${a.excerpt ?? ""}`;
    if (contentReferencesVeryStaleYear(headline)) {
      findings.push({
        kind: "article",
        id: a.id,
        title: a.title,
        reason: "Titre/résumé mentionnant une année très ancienne (≤ 2023)",
        severity: "warning",
        adminPath: `/admin/articles/${a.id}`,
      });
    }
  }

  const { data: events } = await admin
    .from("events")
    .select("id, title, date, end_date, published")
    .eq("published", true)
    .limit(300);

  for (const e of events ?? []) {
    const end = e.end_date ?? e.date;
    if (end && end < pastEventIso) {
      findings.push({
        kind: "event",
        id: e.id,
        title: e.title,
        reason: `Événement terminé (${end}) encore publié`,
        severity: "warning",
        adminPath: `/admin/events/${e.id}`,
      });
      continue;
    }

    if (contentReferencesVeryStaleYear(e.title)) {
      findings.push({
        kind: "event",
        id: e.id,
        title: e.title,
        reason: "Titre avec année très ancienne (≤ 2023)",
        severity: "warning",
        adminPath: `/admin/events/${e.id}`,
      });
    }
  }

  const { data: announcements } = await admin
    .from("announcements")
    .select("id, title, body, published, expires_at")
    .eq("published", true)
    .limit(200);

  for (const n of announcements ?? []) {
    if (n.expires_at && Date.parse(n.expires_at) < Date.now()) {
      findings.push({
        kind: "announcement",
        id: n.id,
        title: n.title,
        reason: "Annonce expirée (expires_at dépassé) encore publiée",
        severity: "warning",
        adminPath: `/admin/announcements/${n.id}`,
      });
      continue;
    }

    if (contentReferencesVeryStaleYear(n.title)) {
      findings.push({
        kind: "announcement",
        id: n.id,
        title: n.title,
        reason: "Titre d’annonce avec année très ancienne (≤ 2023)",
        severity: "warning",
        adminPath: `/admin/announcements/${n.id}`,
      });
    }
  }

  const { data: external } = await admin
    .from("external_articles")
    .select("id, title, excerpt, hidden, published_at")
    .eq("hidden", false)
    .limit(200);

  for (const x of external ?? []) {
    const corpus = `${x.title} ${x.excerpt ?? ""}`;
    if (contentReferencesFacebookStaleYear(corpus)) {
      findings.push({
        kind: "external",
        id: x.id,
        title: x.title,
        reason: "Veille externe visible avec année 2024 ou plus ancienne",
        severity: "critical",
        adminPath: "/admin/external",
      });
    }
  }

  return {
    scannedAt: new Date().toISOString(),
    findings,
    totals: {
      articles: articles?.length ?? 0,
      events: events?.length ?? 0,
      announcements: announcements?.length ?? 0,
      external: external?.length ?? 0,
    },
  };
}
