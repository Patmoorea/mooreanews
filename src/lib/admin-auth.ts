import { getServerSupabase } from "@/lib/supabase/server";

export async function requireStaffSession() {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return { error: "not_configured" as const };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "unauthorized" as const };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return { error: "forbidden" as const };
  }
  return { supabase, user };
}
