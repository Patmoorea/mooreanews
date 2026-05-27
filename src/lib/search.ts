/**
 * Recherche full-text simple sur tout le contenu statique.
 */

import {
  getArticles,
  getEvents,
  getAnnouncements,
  getRestaurants,
  getActivities,
  getInfoPratiques,
} from "@/lib/content";

export type SearchResult = {
  type: "article" | "event" | "annonce" | "restaurant" | "activite" | "info";
  href: string;
  title: string;
  excerpt: string;
  badge: string;
  score: number;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function score(text: string, query: string): number {
  const t = normalize(text);
  const q = normalize(query);
  if (!q) return 0;
  let s = 0;
  for (const word of q.split(/\s+/).filter(Boolean)) {
    const idx = t.indexOf(word);
    if (idx === -1) return 0;
    s += word.length / (idx + 1);
  }
  return s;
}

export async function searchAll(
  query: string,
  limit = 30
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const [articles, events, annonces, restos, activites, infos] = await Promise.all([
    getArticles(),
    getEvents(),
    getAnnouncements(),
    getRestaurants(),
    getActivities(),
    getInfoPratiques(),
  ]);

  const results: SearchResult[] = [];

  for (const a of articles) {
    const corpus = [a.title, a.excerpt, a.body, a.tags?.join(" ") ?? ""].join(
      " "
    );
    const s = score(corpus, query);
    if (s > 0) {
      results.push({
        type: "article",
        href: `/actualites/${a.slug}`,
        title: a.title,
        excerpt: a.excerpt,
        badge: "Actualité",
        score: s,
      });
    }
  }

  for (const e of events) {
    const corpus = [e.title, e.description, e.location, e.organizer ?? ""].join(
      " "
    );
    const s = score(corpus, query);
    if (s > 0) {
      results.push({
        type: "event",
        href: `/evenements/${e.slug}`,
        title: e.title,
        excerpt: `${e.date}${e.time ? " · " + e.time : ""} — ${e.location}`,
        badge: "Événement",
        score: s,
      });
    }
  }

  for (const a of annonces) {
    const corpus = [a.title, a.body, a.district ?? ""].join(" ");
    const s = score(corpus, query);
    if (s > 0) {
      results.push({
        type: "annonce",
        href: `/annonces/${a.slug}`,
        title: a.title,
        excerpt: a.body,
        badge: "Annonce",
        score: s,
      });
    }
  }

  for (const r of restos) {
    const corpus = [
      r.name,
      r.description,
      r.cuisine.join(" "),
      r.district,
      r.address,
    ].join(" ");
    const s = score(corpus, query);
    if (s > 0) {
      results.push({
        type: "restaurant",
        href: `/restaurants/${r.slug}`,
        title: r.name,
        excerpt: `${r.cuisine.join(", ")} · ${r.district}`,
        badge: "Restaurant",
        score: s,
      });
    }
  }

  for (const a of activites) {
    const corpus = [a.name, a.description, a.district ?? "", a.category].join(
      " "
    );
    const s = score(corpus, query);
    if (s > 0) {
      results.push({
        type: "activite",
        href: `/activites/${a.slug}`,
        title: a.name,
        excerpt: a.description,
        badge: "Activité",
        score: s,
      });
    }
  }

  for (const i of infos) {
    const corpus = [i.title, i.description, i.category, i.phone ?? ""].join(
      " "
    );
    const s = score(corpus, query);
    if (s > 0) {
      results.push({
        type: "info",
        href: `/infos-pratiques/${i.slug}`,
        title: i.title,
        excerpt: i.description,
        badge: "Info pratique",
        score: s,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
