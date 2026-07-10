export const PUBLIC_HEALTH_PAGES = [
  { path: "/", label: "accueil" },
  { path: "/alertes", label: "alertes" },
  { path: "/coupures", label: "coupures" },
  { path: "/actualites", label: "actualites" },
] as const;

export type PageProbe = {
  path: string;
  label: string;
  status: number;
  ok: boolean;
  error?: string;
};

export function siteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.mooreanews.com"
  ).replace(/\/$/, "");
}

export async function probePublicPage(
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

export async function probePublicPages(base = siteBaseUrl()): Promise<PageProbe[]> {
  return Promise.all(
    PUBLIC_HEALTH_PAGES.map((p) => probePublicPage(base, p.path, p.label)),
  );
}
