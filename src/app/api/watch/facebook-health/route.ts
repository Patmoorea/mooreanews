import { NextResponse } from "next/server";
import {
  checkFacebookTokenHealth,
  refreshFacebookUserTokenInProcess,
} from "@/lib/facebook-token";

export const dynamic = "force-dynamic";

async function authorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Diagnostic jetons Meta (protégé par CRON_SECRET).
 * GET /api/watch/facebook-health?secret=...
 */
export async function GET(req: Request) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const refresh = await refreshFacebookUserTokenInProcess();
  const health = await checkFacebookTokenHealth();

  return NextResponse.json({
    ok: health.userTokenValid || health.pageTokenValid,
    refreshedInMemory: refresh.refreshed,
    hint: !health.pageTokenValid && health.pagesFromMeAccounts.length > 0
      ? "Copiez access_token de MooreaNews (id 350029589936) depuis me/accounts vers FACEBOOK_PAGE_ACCESS_TOKEN"
      : !health.userTokenValid
        ? "Regénérez FACEBOOK_USER_ACCESS_TOKEN (échange long) + FACEBOOK_APP_ID/SECRET sur Vercel"
        : "Jetons OK",
    health,
    env: {
      appId: Boolean(process.env.FACEBOOK_APP_ID?.trim()),
      appSecret: Boolean(process.env.FACEBOOK_APP_SECRET?.trim()),
    },
  });
}
