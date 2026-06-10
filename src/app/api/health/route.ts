import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { dbListActiveAlerts } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const PUBLIC_PAGES = [
  { path: "/", label: "accueil" },
  { path: "/alertes", label: "alertes" },
  { path: "/coupures", label: "coupures" },
  { path: "/actualites", label: "actualites" },
] as const;

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
  const url = `${base}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      redirect: "follow",
    });
    return {
      path,
      label,
      status: res.status,
      ok: res.ok && res.status < 500,
    };
  } catch (e) {
    return {
      path,
      label,
      status: 0,
      ok: false,
      error: (e as Error).message,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Santé site — pages publiques + (avec secret) APIs et Supabase.
 * GET /api/health
 * GET /api/health?secret=CRON_SECRET
 */
export async function GET(req: Request) {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mooreanews.com"
  ).replace(/\/$/, "");
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
