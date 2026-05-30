/**
 * Statistiques de pages vues — stockage Supabase (anonyme, gratuit).
 */

import { getAdminSupabase } from "@/lib/supabase/admin";

const STATS_DAYS = 30;

export type PageViewInput = {
  path: string;
  referrer?: string | null;
  visitorId?: string | null;
  deviceType?: "mobile" | "desktop" | "tablet" | "unknown" | null;
};

export type VisitStats = {
  configured: boolean;
  periodDays: number;
  todayViews: number;
  todayVisitors: number;
  weekViews: number;
  weekVisitors: number;
  monthViews: number;
  monthVisitors: number;
  daily: { date: string; views: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  topReferrers: { source: string; views: number }[];
  devices: { type: string; views: number; pct: number }[];
};

type PageViewRow = {
  path: string;
  referrer: string | null;
  visitor_id: string | null;
  viewed_at: string;
  device_type?: string | null;
};

function tahitiStartOfDay(offsetDays = 0): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const base = new Date();
  if (offsetDays !== 0) {
    base.setDate(base.getDate() + offsetDays);
  }
  const day = fmt.format(base);
  return new Date(`${day}T00:00:00-10:00`);
}

export function deviceTypeFromUserAgent(ua: string): PageViewInput["deviceType"] {
  const n = ua.toLowerCase();
  if (/ipad|tablet|kindle/i.test(n)) return "tablet";
  if (/mobile|iphone|android|webos|blackberry/i.test(n)) return "mobile";
  if (ua.length > 0) return "desktop";
  return "unknown";
}

export function referrerLabel(referrer: string | null): string {
  if (!referrer?.trim()) return "Accès direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("mooreanews.com")) return "Liens internes";
    if (host.includes("google.")) return "Google";
    if (host.includes("facebook.") || host.includes("fb.")) return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    return host.replace(/^www\./, "");
  } catch {
    return "Autre";
  }
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
    device_type: input.deviceType ?? "unknown",
  });
}

export async function getVisitStats(): Promise<VisitStats> {
  const empty: VisitStats = {
    configured: false,
    periodDays: STATS_DAYS,
    todayViews: 0,
    todayVisitors: 0,
    weekViews: 0,
    weekVisitors: 0,
    monthViews: 0,
    monthVisitors: 0,
    daily: [],
    topPages: [],
    topReferrers: [],
    devices: [],
  };

  const admin = getAdminSupabase();
  if (!admin) return empty;

  const periodStart = new Date(
    Date.now() - STATS_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const weekStart = tahitiStartOfDay(-6).toISOString();
  const todayStart = tahitiStartOfDay().toISOString();

  const { data: weekRows, error } = await admin
    .from("page_views")
    .select("path, referrer, visitor_id, viewed_at, device_type")
    .gte("viewed_at", periodStart)
    .order("viewed_at", { ascending: false })
    .limit(100_000);

  if (error) {
    return empty;
  }

  const rows = (weekRows ?? []) as PageViewRow[];
  const todayRows = rows.filter((r) => r.viewed_at >= todayStart);
  const last7Rows = rows.filter((r) => r.viewed_at >= weekStart);

  const countVisitors = (list: PageViewRow[]) =>
    new Set(list.map((r) => r.visitor_id).filter(Boolean)).size;

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
    .slice(0, 20)
    .map(([path, views]) => ({ path, views }));

  const refCounts = new Map<string, number>();
  for (const r of rows) {
    const label = referrerLabel(r.referrer);
    refCounts.set(label, (refCounts.get(label) ?? 0) + 1);
  }
  const topReferrers = [...refCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([source, views]) => ({ source, views }));

  const deviceCounts = new Map<string, number>();
  for (const r of rows) {
    const t = r.device_type ?? "unknown";
    deviceCounts.set(t, (deviceCounts.get(t) ?? 0) + 1);
  }
  const totalDeviceViews = rows.length || 1;
  const deviceLabels: Record<string, string> = {
    mobile: "Mobile",
    desktop: "Ordinateur",
    tablet: "Tablette",
    unknown: "Non renseigné",
  };
  const devices = [...deviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, views]) => ({
      type: deviceLabels[type] ?? type,
      views,
      pct: Math.round((views / totalDeviceViews) * 100),
    }));

  return {
    configured: true,
    periodDays: STATS_DAYS,
    todayViews: todayRows.length,
    todayVisitors: countVisitors(todayRows),
    weekViews: last7Rows.length,
    weekVisitors: countVisitors(last7Rows),
    monthViews: rows.length,
    monthVisitors: countVisitors(rows),
    daily,
    topPages,
    topReferrers,
    devices,
  };
}
