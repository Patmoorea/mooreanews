import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { dbListActiveAlerts } from "@/lib/supabase/queries";
import {
  probePublicPage,
  PUBLIC_HEALTH_PAGES,
  siteBaseUrl,
} from "@/lib/site-health-probe";

export const dynamic = "force-dynamic";

const PUBLIC_PAGES = PUBLIC_HEALTH_PAGES;

type PageProbe = {
  path: string;
  label: string;
  status: number;
  ok: boolean;
  error?: string;
};

async function probePage(
  base: string,
  path: string,
  label: string,
  timeoutMs = 25_000,
): Promise<PageProbe> {
  return probePublicPage(base, path, label, timeoutMs);
}

/**
 * Santé site — pages publiques + (avec secret) APIs et Supabase.
 * GET /api/health
 * GET /api/health?secret=CRON_SECRET
 */
export async function GET(req: Request) {
  const base = siteBaseUrl();
  const verbose = await verifyCronAuth(req);

  const pages = await Promise.all(
    PUBLIC_PAGES.map((p) => probePage(base, p.path, p.label)),
  );
  const pagesOk = pages.every((p) => p.ok);

  let apis: { path: string; status: number; ok: boolean }[] | undefined;
  let supabaseOk: boolean | undefined;

  if (verbose) {
    const apiPaths = ["/api/alerts", "/api/weather", "/api/ferries"];
    apis = await Promise.all(
      apiPaths.map(async (path) => {
        try {
          const res = await fetch(`${base}${path}`, { cache: "no-store" });
          return { path, status: res.status, ok: res.ok };
        } catch {
          return { path, status: 0, ok: false };
        }
      }),
    );
    try {
      const rows = await dbListActiveAlerts();
      supabaseOk = rows !== null;
    } catch {
      supabaseOk = false;
    }
  }

  const apisOk = apis ? apis.every((a) => a.ok) : true;
  const ok = pagesOk && apisOk && (supabaseOk ?? true);

  return NextResponse.json(
    {
      ok,
      site: base,
      checkedAt: new Date().toISOString(),
      pages,
      ...(verbose ? { apis, supabaseOk } : {}),
    },
    { status: ok ? 200 : 503 },
  );
}
