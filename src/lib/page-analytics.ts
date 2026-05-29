/**
 * Statistiques de pages vues — stockage Supabase (anonyme).
 */

import { getAdminSupabase } from "@/lib/supabase/admin";

export type PageViewInput = {
  path: string;
  referrer?: string | null;
  visitorId?: string | null;
};

export type VisitStats = {
  configured: boolean;
  todayViews: number;
  todayVisitors: number;
  weekViews: number;
  weekVisitors: number;
  daily: { date: string; views: number; visitors: number }[];
  topPages: { path: string; views: number }[];
};

function tahitiStartOfDay(): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const day = fmt.format(new Date());
  return new Date(`${day}T00:00:00-10:00`);
}

export async function recordPageView(input: PageViewInput): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;

  const path = input.path.slice(0, 500);
  if (path.startsWith("/admin") || path.startsWith("/api")) return;

  await admin.from("page_views").insert({
    path,
    referrer: input.referrer?.slice(0, 500) ?? null,
    visitor_id: input.visitorId?.slice(0, 64) ?? null,
  });
}

export async function getVisitStats(): Promise<VisitStats> {
  const admin = getAdminSupabase();
  if (!admin) {
    return {
      configured: false,
      todayViews: 0,
      todayVisitors: 0,
      weekViews: 0,
      weekVisitors: 0,
      daily: [],
      topPages: [],
    };
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = tahitiStartOfDay().toISOString();

  const { data: weekRows } = await admin
    .from("page_views")
    .select("path, visitor_id, viewed_at")
    .gte("viewed_at", weekAgo)
    .order("viewed_at", { ascending: false })
    .limit(50000);

  const rows = weekRows ?? [];
  const todayRows = rows.filter((r) => r.viewed_at >= todayStart);

  const todayVisitors = new Set(
    todayRows.map((r) => r.visitor_id).filter(Boolean),
  ).size;
  const weekVisitors = new Set(
    rows.map((r) => r.visitor_id).filter(Boolean),
  ).size;

  const dailyMap = new Map<string, { views: number; visitors: Set<string> }>();
  for (const r of rows) {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Pacific/Tahiti",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(r.viewed_at));
    const entry = dailyMap.get(date) ?? { views: 0, visitors: new Set() };
    entry.views += 1;
    if (r.visitor_id) entry.visitors.add(r.visitor_id);
    dailyMap.set(date, entry);
  }

  const daily = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      views: v.views,
      visitors: v.visitors.size,
    }));

  const pathCounts = new Map<string, number>();
  for (const r of rows) {
    pathCounts.set(r.path, (pathCounts.get(r.path) ?? 0) + 1);
  }
  const topPages = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([path, views]) => ({ path, views }));

  return {
    configured: true,
    todayViews: todayRows.length,
    todayVisitors,
    weekViews: rows.length,
    weekVisitors,
    daily,
    topPages,
  };
}
