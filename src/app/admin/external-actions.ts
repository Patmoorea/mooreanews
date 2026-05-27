"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { aggregateAll } from "@/lib/aggregator";

async function requireAdmin() {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor"))
    throw new Error("Forbidden");
  return supabase;
}

export async function runAggregation() {
  await requireAdmin();
  await aggregateAll();
  revalidatePath("/admin/external");
  revalidatePath("/actualites");
  revalidatePath("/");
}

export async function toggleExternalArticle(id: string, hidden: boolean) {
  const supabase = await requireAdmin();
  await supabase
    .from("external_articles")
    .update({ hidden })
    .eq("id", id);
  revalidatePath("/admin/external");
  revalidatePath("/actualites");
}
