import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/server";

/**
 * Callback de confirmation d'email / magic link Supabase.
 * Échange le code contre une session (cookies sur la réponse) puis redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/admin";

  let redirectPath = nextParam;
  if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    redirectPath = "/admin";
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnon = getSupabaseAnonKey();

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.redirect(`${origin}/auth/login?error=config`);
  }

  const redirectTo = new URL(redirectPath, origin);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return response;
}
