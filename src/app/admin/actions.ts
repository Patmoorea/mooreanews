"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contentReferencesStaleYear } from "@/lib/facebook-import-filters";
import { hideExternalArticlesForArticleSlug } from "@/lib/facebook-external-sync";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { importMissingRestaurantsFromJson } from "@/lib/supabase/sync-restaurants";
import { importMissingInfoPratiquesFromJson } from "@/lib/supabase/sync-info-pratiques";
import { slugify } from "@/lib/utils";

type TableName =
  | "articles"
  | "events"
  | "announcements"
  | "restaurants"
  | "activities"
  | "info_pratiques"
  | "alerts";

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
  return { supabase, userId: user.id };
}

function publicPathFor(table: TableName): string {
  switch (table) {
    case "articles":
      return "/actualites";
    case "events":
      return "/evenements";
    case "announcements":
      return "/annonces";
    case "restaurants":
      return "/restaurants";
    case "activities":
      return "/activites";
    case "info_pratiques":
      return "/infos-pratiques";
    case "alerts":
      return "/";
  }
}

function parseFormPayload(
  table: TableName,
  fd: FormData
): Record<string, unknown> {
  const get = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v.trim() : "";
  };
  const getBool = (k: string) => fd.get(k) === "on" || fd.get(k) === "true";
  const getArr = (k: string) =>
    get(k)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const getNum = (k: string) => {
    const v = get(k);
    return v ? Number(v) : null;
  };

  switch (table) {
    case "articles":
      return {
        slug: get("slug") || slugify(get("title")),
        title: get("title"),
        excerpt: get("excerpt"),
        body: get("body"),
        category: get("category"),
        tags: getArr("tags"),
        cover_url: get("cover_url") || null,
        author: get("author") || null,
        featured: getBool("featured"),
        published: getBool("published"),
      };
    case "events":
      return {
        title: get("title"),
        description: get("description"),
        category: get("category"),
        date: get("date"),
        end_date: get("end_date") || null,
        start_time: get("start_time") || null,
        end_time: get("end_time") || null,
        location: get("location"),
        district: get("district") || null,
        organizer: get("organizer") || null,
        price: get("price") || null,
        contact: get("contact") || null,
        url: get("url") || null,
        cover_url: get("cover_url") || null,
        published: getBool("published"),
      };
    case "announcements":
      return {
        title: get("title"),
        body: get("body"),
        category: get("category"),
        district: get("district") || null,
        price: get("price") || null,
        contact: get("contact") || null,
        author: get("author") || null,
        cover_url: get("cover_url") || null,
        published: getBool("published"),
      };
    case "restaurants":
      return {
        name: get("name"),
        description: get("description"),
        cuisine: getArr("cuisine"),
        district: get("district"),
        address: get("address"),
        phone: get("phone") || null,
        hours: get("hours") || null,
        price_range: get("price_range") || null,
        lat: getNum("lat"),
        lon: getNum("lon"),
        url: get("url") || null,
        cover_url: get("cover_url") || null,
        published: getBool("published"),
        featured: getBool("featured"),
      };
    case "activities":
      return {
        name: get("name"),
        description: get("description"),
        category: get("category"),
        district: get("district") || null,
        address: get("address") || null,
        phone: get("phone") || null,
        price: get("price") || null,
        duration: get("duration") || null,
        lat: getNum("lat"),
        lon: getNum("lon"),
        url: get("url") || null,
        cover_url: get("cover_url") || null,
        published: getBool("published"),
        featured: getBool("featured"),
      };
    case "info_pratiques":
      return {
        title: get("title"),
        description: get("description"),
        category: get("category"),
        address: get("address") || null,
        phone: get("phone") || null,
        hours: get("hours") || null,
        emergency: getBool("emergency"),
        url: get("url") || null,
        lat: getNum("lat"),
        lon: getNum("lon"),
        published: getBool("published"),
        display_order: Number(get("display_order") || "0"),
      };
    case "alerts":
      return {
        type: get("type") || "autre",
        severity: get("severity") || "info",
        title: get("title"),
        details: get("details") || null,
        district: get("district") || null,
        source_url: get("source_url") || null,
        starts_at: get("starts_at") || null,
        ends_at: get("ends_at") || null,
        active: getBool("active"),
        urgent: getBool("urgent"),
      };
  }
}

function adminPathFor(table: TableName): string {
  return table === "info_pratiques" ? "/admin/info" : `/admin/${table}`;
}

function revalidateArticlePublicPaths(slug?: string) {
  revalidatePath("/actualites");
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/actualites/${slug}`);
}

async function syncFacebookArticleVisibility(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  id: string,
  published: boolean,
) {
  if (!supabase || published) return;
  const { data } = await supabase
    .from("articles")
    .select("slug, tags")
    .eq("id", id)
    .maybeSingle();
  if (!data?.slug) return;
  const tags = data.tags ?? [];
  if (!tags.includes("facebook-import")) return;
  await hideExternalArticlesForArticleSlug(data.slug);
}

export async function createContent(table: TableName, formData: FormData) {
  const { supabase } = await requireAdmin();
  const payload = parseFormPayload(table, formData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any).insert(payload);
  if (error) throw error;
  revalidatePath(adminPathFor(table));
  revalidatePath(publicPathFor(table));
  if (table === "events" || table === "announcements") {
    revalidatePath("/", "layout");
  }
  redirect(adminPathFor(table));
}

export async function updateContent(
  table: TableName,
  id: string,
  formData: FormData
) {
  const { supabase } = await requireAdmin();
  const payload = parseFormPayload(table, formData);
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from(table) as any
  )
    .update(payload)
    .eq("id", id);
  if (error) throw error;

  if (table === "articles") {
    const slug =
      typeof payload.slug === "string" ? payload.slug : undefined;
    const published = payload.published === true;
    if (!published) {
      await syncFacebookArticleVisibility(supabase, id, false);
    }
    revalidateArticlePublicPaths(slug);
  } else {
    revalidatePath(publicPathFor(table));
  }

  revalidatePath(adminPathFor(table));
  if (table === "events") revalidatePath(`/evenements/${id}`);
  if (table === "announcements") revalidatePath(`/annonces/${id}`);
  redirect(adminPathFor(table));
}

export async function deleteContent(table: TableName, id: string) {
  const { supabase } = await requireAdmin();

  let articleSlug: string | undefined;
  if (table === "articles") {
    const { data } = await supabase
      .from("articles")
      .select("slug, tags")
      .eq("id", id)
      .maybeSingle();
    articleSlug = data?.slug;
    if (data?.tags?.includes("facebook-import") && articleSlug) {
      await hideExternalArticlesForArticleSlug(articleSlug);
    }
  }

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
  revalidatePath(adminPathFor(table));
  if (table === "articles") {
    revalidateArticlePublicPaths(articleSlug);
  } else {
    revalidatePath(publicPathFor(table));
  }
  if (table === "restaurants") {
    revalidatePath(`/restaurants/${id}`);
  }
}

export async function togglePublished(
  table: TableName,
  id: string,
  current: boolean
) {
  const { supabase } = await requireAdmin();
  const nextPublished = !current;

  let articleSlug: string | undefined;
  if (table === "articles") {
    const { data } = await supabase
      .from("articles")
      .select("slug")
      .eq("id", id)
      .maybeSingle();
    articleSlug = data?.slug;
  }

  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from(table) as any
  )
    .update({ published: nextPublished })
    .eq("id", id);
  if (error) throw error;

  if (table === "articles") {
    await syncFacebookArticleVisibility(supabase, id, nextPublished);
    revalidateArticlePublicPaths(articleSlug);
  } else {
    revalidatePath(publicPathFor(table));
  }
  revalidatePath(adminPathFor(table));
}

/** Dépublie les imports Facebook déjà en base (2021–2022, etc.) et masque la veille externe liée. */
export async function unpublishLegacyFacebookImports(): Promise<{
  unpublished: number;
}> {
  const { supabase } = await requireAdmin();
  const admin = getAdminSupabase();
  const db = admin ?? supabase;

  const { data: rows } = await db
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published")
    .contains("tags", ["facebook-import"]);

  let unpublished = 0;
  for (const row of rows ?? []) {
    const corpus = `${row.title} ${row.excerpt} ${row.body}`;
    const staleByText = contentReferencesStaleYear(corpus);
    const staleByTitle =
      /\bpublication du 20\d{2}-\d{2}-\d{2}\b/i.test(row.title) &&
      contentReferencesStaleYear(row.title);

    if (!staleByText && !staleByTitle && row.published) continue;

    if (row.published) {
      await db.from("articles").update({ published: false }).eq("id", row.id);
      unpublished += 1;
    }
    if (row.slug) {
      await hideExternalArticlesForArticleSlug(row.slug);
    }
  }

  revalidatePath("/admin/articles");
  revalidateArticlePublicPaths();
  return { unpublished };
}

export async function toggleAlertActive(id: string, current: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("alerts")
    .update({ active: !current, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/alerts");
  revalidatePath("/", "layout");
}

export async function toggleAlertUrgent(id: string, current: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("alerts")
    .update({ urgent: !current, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/alerts");
  revalidatePath("/", "layout");
}

/**
 * Approuve une soumission : crée l'entrée correspondante dans la table cible
 * puis marque la soumission comme approuvée.
 */
export async function approveSubmission(id: string, formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const { data: sub, error: e1 } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();
  if (e1 || !sub) throw e1 ?? new Error("not_found");

  const coverUrl =
    typeof sub.cover_url === "string" && sub.cover_url.trim()
      ? sub.cover_url.trim()
      : null;

  if (sub.type === "event") {
    const { data: created } = await supabase
      .from("events")
      .insert({
        title: sub.title,
        description: sub.description,
        category: "communaute",
        date: sub.date || new Date().toISOString().slice(0, 10),
        start_time: sub.start_time,
        location: sub.location || "Moorea",
        district: sub.district,
        organizer: sub.user_name,
        contact: sub.user_email,
        cover_url: coverUrl,
        published: true,
      })
      .select("id")
      .single();
    if (created?.id) revalidatePath(`/evenements/${created.id}`);
  } else if (sub.type === "annonce" || sub.type === "service") {
    const { data: created } = await supabase
      .from("announcements")
      .insert({
        title: sub.title,
        body: sub.description,
        category: sub.type === "service" ? "services" : "general",
        district: sub.district,
        contact: sub.user_email,
        author: sub.user_name,
        cover_url: coverUrl,
        published: true,
      })
      .select("id")
      .single();
    if (created?.id) revalidatePath(`/annonces/${created.id}`);
  } else if (sub.type === "signalement" || sub.type === "suggestion") {
    // Pas de table cible automatique : la modération sert surtout à tracer
    // la demande et à traiter manuellement si besoin.
  }

  const adminNotes = formData.get("admin_notes");
  await supabase
    .from("submissions")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      admin_notes: typeof adminNotes === "string" ? adminNotes : null,
    })
    .eq("id", id);

  revalidatePath("/admin/submissions");
  revalidatePath("/evenements");
  revalidatePath("/annonces");
  revalidatePath("/", "layout");
}

export async function rejectSubmission(id: string, formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const adminNotes = formData.get("admin_notes");
  await supabase
    .from("submissions")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      admin_notes: typeof adminNotes === "string" ? adminNotes : null,
    })
    .eq("id", id);
  revalidatePath("/admin/submissions");
}

/** Importe les restaurants du JSON qui ne sont pas encore en base (admin, 1 clic). */
export async function importRestaurantsFromCatalog() {
  await requireAdmin();
  const result = await importMissingRestaurantsFromJson();
  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
  return result;
}

/** Importe les infos pratiques du JSON qui ne sont pas encore en base (admin, 1 clic). */
export async function importInfoPratiquesFromJson() {
  await requireAdmin();
  const result = await importMissingInfoPratiquesFromJson();
  revalidatePath("/admin/info");
  revalidatePath("/infos-pratiques");
  return result;
}
