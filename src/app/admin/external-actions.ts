"use server";

import { revalidatePath } from "next/cache";
import { aggregateAll } from "@/lib/aggregator";
import { externalIdFromFacebookUrl } from "@/lib/facebook-url";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

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

/** Ajoute un lien Facebook (post/groupe) repéré manuellement — pas de scraping auto. */
export async function addFacebookCommunityLink(formData: FormData) {
  await requireAdmin();
  const admin = getAdminSupabase();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant");

  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();

  if (!url.includes("facebook.com") || !title) {
    throw new Error("URL Facebook et titre requis");
  }

  const { error } = await admin.from("external_articles").upsert(
    {
      source_id: "facebook-community",
      source_name: "Facebook — communauté",
      external_id: externalIdFromFacebookUrl(url),
      url,
      title,
      excerpt: excerpt || null,
      published_at: new Date().toISOString(),
      hidden: false,
    },
    { onConflict: "source_id,external_id" }
  );

  if (error) throw error;

  revalidatePath("/admin/external");
  revalidatePath("/actualites");
  revalidatePath("/");
}
