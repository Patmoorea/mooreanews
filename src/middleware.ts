import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refresh la session Supabase à chaque requête et protège /admin.
 * Si Supabase n'est pas configuré, le middleware est neutre.
 */
const CANONICAL_HOST = "www.mooreanews.com";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";

  // Apex → www (308) pour éviter « Page avec redirection » en GSC
  if (host === "mooreanews.com") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  // Supabase renvoie parfois vers la Site URL (/?code=…) au lieu de /auth/callback
  const authCode = request.nextUrl.searchParams.get("code");
  if (authCode && pathname !== "/auth/callback") {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", authCode);
    const next = request.nextUrl.searchParams.get("next");
    if (next) callback.searchParams.set("next", next);
    return NextResponse.redirect(callback);
  }

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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|xml|txt)$).*)",
  ],
};
