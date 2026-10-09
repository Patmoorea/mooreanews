import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refresh la session Supabase et protège /admin.
 * Si Supabase n'est pas configuré, le middleware est neutre.
 *
 * Ne tourne plus que sur les pages qui lisent la session côté serveur
 * (admin, compte, auth) + « / » pour le retour ?code=… de Supabase.
 * Avant, il tournait sur CHAQUE requête (pages publiques, /api/alerts interrogé
 * toutes les 30 s par chaque onglet, pageviews…) et appelait Supabase à chaque
 * fois → « Fluid Active CPU » du plan gratuit épuisé. Les pages publiques
 * n'utilisent que le client Supabase anonyme ; le menu compte (client) rafraîchit
 * sa session lui-même.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Supabase renvoie parfois vers la Site URL (/?code=…) au lieu de /auth/callback
  const authCode = request.nextUrl.searchParams.get("code");
  if (authCode && pathname !== "/auth/callback") {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", authCode);
    const next = request.nextUrl.searchParams.get("next");
    if (next) callback.searchParams.set("next", next);
    return NextResponse.redirect(callback);
  }

  // « / » est dans le matcher uniquement pour la redirection ?code= ci-dessus.
  if (!needsSession(pathname)) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      const denied = new URL("/auth/denied", request.url);
      return NextResponse.redirect(denied);
    }
  }

  return response;
}

const SESSION_PREFIXES = ["/admin", "/mon-compte", "/auth", "/api/admin"];

function needsSession(pathname: string): boolean {
  return SESSION_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/mon-compte/:path*",
    "/auth/:path*",
    "/api/admin/:path*",
  ],
};
