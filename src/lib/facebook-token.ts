/**
 * Santé et renouvellement du jeton utilisateur Facebook (longue durée).
 * Nécessite FACEBOOK_APP_ID + FACEBOOK_APP_SECRET + FACEBOOK_USER_ACCESS_TOKEN sur Vercel.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

export type FacebookTokenHealth = {
  userTokenPresent: boolean;
  pageTokenPresent: boolean;
  userTokenValid: boolean;
  pageTokenValid: boolean;
  userExpiresAt: string | null;
  daysUntilUserExpiry: number | null;
  pagesFromMeAccounts: { id: string; name: string }[];
  refreshedThisRun: boolean;
  errors: string[];
};

type DebugTokenData = {
  is_valid?: boolean;
  expires_at?: number;
  data_access_expires_at?: number;
  error?: { message?: string };
};

async function debugToken(
  inputToken: string,
  appId: string,
  appSecret: string,
): Promise<DebugTokenData | null> {
  const url = new URL(`${GRAPH}/debug_token`);
  url.searchParams.set("input_token", inputToken);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: DebugTokenData };
  return json.data ?? null;
}

/** Échange un jeton utilisateur contre un jeton long (~60 j). */
export async function exchangeForLongLivedUserToken(
  shortOrLongToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
  const appId = process.env.FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();
  if (!appId || !appSecret) return null;

  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortOrLongToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!json.access_token) return null;
  return {
    access_token: json.access_token,
    expires_in: json.expires_in ?? 0,
  };
}

function expiryUnix(data: DebugTokenData): number | null {
  const exp = data.expires_at ?? data.data_access_expires_at;
  return typeof exp === "number" && exp > 0 ? exp : null;
}

/**
 * Renouvelle le jeton utilisateur en mémoire si expiration < 14 jours
 * (nécessite APP_ID + APP_SECRET). Met à jour process.env pour ce process Node.
 */
export async function refreshFacebookUserTokenInProcess(): Promise<{
  token: string | null;
  refreshed: boolean;
}> {
  const current = process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim() ?? null;
  const appId = process.env.FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();

  if (!current) return { token: null, refreshed: false };
  if (!appId || !appSecret) return { token: current, refreshed: false };

  const debug = await debugToken(current, appId, appSecret);
  if (!debug?.is_valid) {
    const exchanged = await exchangeForLongLivedUserToken(current);
    if (exchanged) {
      process.env.FACEBOOK_USER_ACCESS_TOKEN = exchanged.access_token;
      return { token: exchanged.access_token, refreshed: true };
    }
    return { token: current, refreshed: false };
  }

  const exp = expiryUnix(debug);
  if (!exp) return { token: current, refreshed: false };

  const daysLeft = (exp * 1000 - Date.now()) / (24 * 60 * 60 * 1000);
  if (daysLeft > 14) return { token: current, refreshed: false };

  const exchanged = await exchangeForLongLivedUserToken(current);
  if (!exchanged) return { token: current, refreshed: false };

  process.env.FACEBOOK_USER_ACCESS_TOKEN = exchanged.access_token;
  return { token: exchanged.access_token, refreshed: true };
}

async function probeToken(token: string): Promise<boolean> {
  const url = new URL(`${GRAPH}/me`);
  url.searchParams.set("fields", "id");
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString(), { cache: "no-store" });
  return res.ok;
}

export async function checkFacebookTokenHealth(): Promise<FacebookTokenHealth> {
  const userToken = process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim() ?? "";
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() ?? "";
  const appId = process.env.FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();

  const health: FacebookTokenHealth = {
    userTokenPresent: Boolean(userToken),
    pageTokenPresent: Boolean(pageToken),
    userTokenValid: false,
    pageTokenValid: false,
    userExpiresAt: null,
    daysUntilUserExpiry: null,
    pagesFromMeAccounts: [],
    refreshedThisRun: false,
    errors: [],
  };

  if (userToken) {
    health.userTokenValid = await probeToken(userToken);
    if (appId && appSecret) {
      const debug = await debugToken(userToken, appId, appSecret);
      if (debug) {
        const exp = expiryUnix(debug);
        if (exp) {
          health.userExpiresAt = new Date(exp * 1000).toISOString();
          health.daysUntilUserExpiry = Math.round(
            (exp * 1000 - Date.now()) / (24 * 60 * 60 * 1000),
          );
        }
        if (!debug.is_valid) {
          health.errors.push("Jeton utilisateur invalide (debug_token)");
        }
      }
    }
    if (health.userTokenValid) {
      try {
        const url = new URL(`${GRAPH}/me/accounts`);
        url.searchParams.set(
          "fields",
          "id,name,username,access_token",
        );
        url.searchParams.set("access_token", userToken);
        const res = await fetch(url.toString(), { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as {
            data?: { id: string; name?: string }[];
          };
          health.pagesFromMeAccounts = (json.data ?? []).map((p) => ({
            id: p.id,
            name: p.name ?? p.id,
          }));
          if (health.pagesFromMeAccounts.length === 0) {
            const pageUrl = new URL(`${GRAPH}/350029589936`);
            pageUrl.searchParams.set("fields", "name,access_token");
            pageUrl.searchParams.set("access_token", userToken);
            const pageRes = await fetch(pageUrl.toString(), {
              cache: "no-store",
            });
            if (pageRes.ok) {
              const pageJson = (await pageRes.json()) as {
                id?: string;
                name?: string;
              };
              if (pageJson.id) {
                health.pagesFromMeAccounts.push({
                  id: pageJson.id,
                  name: pageJson.name ?? "MooreaNews",
                });
              }
            }
          }
        } else {
          const body = await res.text();
          if (body.includes("nonexisting field (accounts)")) {
            health.errors.push(
              "me/accounts inaccessible — vérifiez que FACEBOOK_USER_ACCESS_TOKEN est un jeton UTILISATEUR (pas page) avec pages_show_list",
            );
          } else {
            health.errors.push(`me/accounts: HTTP ${res.status}`);
          }
        }
      } catch (e) {
        health.errors.push(String(e));
      }
    }
  }

  if (pageToken) {
    health.pageTokenValid = await probeToken(pageToken);
    if (!health.pageTokenValid) {
      health.errors.push(
        "FACEBOOK_PAGE_ACCESS_TOKEN invalide — utilisez le access_token de /me/accounts (page MooreaNews), pas le jeton utilisateur.",
      );
    }
  }

  return health;
}
