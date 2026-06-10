"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contentReferencesStaleYear } from "@/lib/facebook-import-filters";
import { parseDatetimeLocalTahiti } from "@/lib/alert-schedule";
import { hideExternalArticlesForArticleSlug } from "@/lib/facebook-external-sync";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { importMissingRestaurantsFromJson } from "@/lib/supabase/sync-restaurants";
import { importMissingAccommodationsFromJson } from "@/lib/supabase/sync-accommodations";
import { importMissingInfoPratiquesFromJson } from "@/lib/supabase/sync-info-pratiques";
import {
  insertInfoPratiqueRow,
  updateInfoPratiqueRow,
  type InfoPratiqueRowInput,
} from "@/lib/supabase/info-pratiques-db";
import { notifyAlertSubscribers } from "@/lib/push-notify";
import type { AlertRow } from "@/lib/supabase/types";
import { slugify } from "@/lib/utils";

type TableName =
  | "articles"
  | "events"
  | "announcements"
  | "restaurants"
  | "accommodations"
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
    case "accommodations":
      return "/hebergements";
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
    const v = get(k).replace(",", ".");
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
        google_place_id: get("google_place_id") || null,
        merchant_email: get("merchant_email") || null,
        merchant_open_status:
          get("merchant_open_status") === "open" ||
          get("merchant_open_status") === "closed"
            ? get("merchant_open_status")
            : null,
      };
    case "accommodations":
      return {
        slug: get("slug") || slugify(get("name")),
        name: get("name"),
        description: get("description"),
        type: get("type") || "pension",
        district: get("district"),
        address: get("address") || null,
        phone: get("phone") || null,
        email: get("email") || null,
        url: get("url") || null,
        price_hint: get("price_hint") || null,
        availability_status: get("availability_status") || "contact",
        lat: getNum("lat"),
        lon: getNum("lon"),
        cover_url: get("cover_url") || null,
        merchant_email: get("merchant_email") || null,
        published: getBool("published"),
        featured: getBool("featured"),
        display_order: Number(get("display_order") || "0"),
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
        map_icon_url: get("map_icon_url") || null,
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
        starts_at: parseDatetimeLocalTahiti(get("starts_at")) ?? null,
        ends_at: parseDatetimeLocalTahiti(get("ends_at")) ?? null,
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

function revalidateAlertPublicPaths() {
  revalidatePath("/alertes");
  revalidatePath("/", "layout");
}

async function dispatchAlertNotifications(alert: AlertRow) {
  try {
    await notifyAlertSubscribers(alert);
  } catch {
    /* push/email ne doit pas bloquer l'admin */
  }
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
  if (table === "info_pratiques") {
    const { error, legacySchema } = await insertInfoPratiqueRow(
      supabase,
      payload as InfoPratiqueRowInput,
    );
    if (error) throw new Error(error);
    revalidatePath(adminPathFor(table));
    revalidatePath(publicPathFor(table));
    revalidatePath("/");
    if (
      legacySchema &&
      (payload.lat != null || payload.lon != null)
    ) {
      redirect(`${adminPathFor(table)}?warning=coords_schema`);
    }
  } else if (table === "alerts") {
    const { data, error } = await supabase
      .from("alerts")
      .insert(payload as Partial<AlertRow>)
      .select("*")
      .single();
    if (error) throw error;
    if (data?.active) await dispatchAlertNotifications(data);
  } else {
    let finalPayload = payload;
    if (table === "restaurants") {
      const p = { ...payload } as Record<string, unknown>;
      const status = p.merchant_open_status;
      if (status === "open" || status === "closed") {
        p.merchant_open_updated_at = new Date().toISOString();
      }
      finalPayload = p;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table) as any).insert(finalPayload);
    if (error) throw error;
  }
  revalidatePath(adminPathFor(table));
  revalidatePath(publicPathFor(table));
  if (table === "events" || table === "announcements") {
    revalidatePath("/", "layout");
  }
  if (table === "accommodations") {
    revalidatePath("/visiteurs");
    revalidatePath("/hebergements");
  }
  if (table === "alerts") {
    revalidateAlertPublicPaths();
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
  if (table === "info_pratiques") {
    const { error, legacySchema } = await updateInfoPratiqueRow(
      supabase,
      id,
      payload as Partial<InfoPratiqueRowInput>,
    );
    if (error) throw new Error(error);
    revalidatePath("/");
    if (
      legacySchema &&
      (payload.lat != null || payload.lon != null)
    ) {
      redirect(`${adminPathFor(table)}/${id}?warning=coords_schema`);
    }
  } else if (table === "alerts") {
    const { data, error } = await supabase
      .from("alerts")
      .update(payload as Partial<AlertRow>)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    if (data?.active) await dispatchAlertNotifications(data);
  } else {
    let finalPayload = payload;
    if (table === "restaurants") {
      const p = payload as Record<string, unknown>;
      const status = p.merchant_open_status;
      if (status === "open" || status === "closed") {
        p.merchant_open_updated_at = new Date().toISOString();
      } else if (status === null) {
        p.merchant_open_updated_at = null;
      }
      finalPayload = p;
    }
    const { error } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from(table) as any
    )
      .update(finalPayload)
      .eq("id", id);
    if (error) throw error;
    if (table === "restaurants" || table === "activities" || table === "accommodations") {
      revalidatePath("/");
    }
  }

  if (table === "articles") {
    const slug =
      typeof payload.slug === "string" ? payload.slug : undefined;
    const published = payload.published === true;
    if (!published) {
      await syncFacebookArticleVisibility(supabase, id, false);
    }
    revalidateArticlePublicPaths(slug);
  } else if (table === "alerts") {
    revalidateAlertPublicPaths();
  } else {
    revalidatePath(publicPathFor(table));
  }

  revalidatePath(adminPathFor(table));
  if (table === "events") revalidatePath(`/evenements/${id}`);
  if (table === "announcements") revalidatePath(`/annonces/${id}`);
  redirect(adminPathFor(table));
}

export async function deleteContent(table: TableName, id: string) {
  await requireAdmin();
  const admin = getAdminSupabase();
  const supabase = admin ?? (await getServerSupabase());
  if (!supabase) throw new Error("Supabase not configured");

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
  if (error) throw new Error(error.message);
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

/** Supprime définitivement les imports Facebook obsolètes (2021–2022, etc.). */
export async function deleteLegacyFacebookImports(): Promise<{
  deleted: number;
}> {
  await requireAdmin();
  const admin = getAdminSupabase();
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquant sur Vercel — suppression impossible.",
    );
  }

  const { purgeStaleFacebookImports, purgeStaleFacebookEvents } = await import(
    "@/lib/facebook-import-cleanup"
  );
  const { deleted } = await purgeStaleFacebookImports();
  const eventsCleanup = await purgeStaleFacebookEvents();

  const { data: externalRows } = await admin
    .from("external_articles")
    .select("id, title, excerpt")
    .eq("hidden", false);

  for (const ext of externalRows ?? []) {
    const corpus = `${ext.title} ${ext.excerpt ?? ""}`;
    if (contentReferencesStaleYear(corpus)) {
      await admin
        .from("external_articles")
        .update({ hidden: true })
        .eq("id", ext.id);
    }
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/events");
  revalidatePath("/evenements");
  revalidateArticlePublicPaths();
  return {
    deleted: deleted + eventsCleanup.unpublished + eventsCleanup.deleted,
  };
}

/** Supprime les actualités Facebook en double (même publication, slugs différents). */
export async function deleteDuplicateArticles(): Promise<{
  deleted: number;
  groups: number;
}> {
  const { supabase } = await requireAdmin();
  const admin = getAdminSupabase() ?? supabase;

  const { purgeDuplicateArticles } = await import(
    "@/lib/article-duplicate-cleanup"
  );
  const result = await purgeDuplicateArticles(admin);

  revalidatePath("/admin/articles");
  revalidatePath("/actualites");
  revalidateArticlePublicPaths();
  return result;
}

/** @deprecated Utiliser deleteLegacyFacebookImports */
export async function unpublishLegacyFacebookImports(): Promise<{
  unpublished: number;
}> {
  const { deleted } = await deleteLegacyFacebookImports();
  return { unpublished: deleted };
}

export async function toggleAlertActive(id: string, current: boolean) {
  const { supabase } = await requireAdmin();
  const next = !current;
  const { data, error } = await supabase
    .from("alerts")
    .update({ active: next, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  if (data?.active) await dispatchAlertNotifications(data);
  revalidatePath("/admin/alerts");
  revalidateAlertPublicPaths();
}

export async function toggleAlertUrgent(id: string, current: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("alerts")
    .update({ urgent: !current, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/alerts");
  revalidateAlertPublicPaths();
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
  } else if (sub.type === "signalement") {
    const district =
      sub.district && sub.district !== "Toute l'île" ? sub.district : null;
    const details = [
      sub.description,
      sub.location ? `Lieu : ${sub.location}` : null,
      sub.user_name ? `Signalé par : ${sub.user_name}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");
    const descLower = `${sub.title} ${sub.description}`.toLowerCase();
    const breaking =
      /ferry|route|coupure|cyclone|méduse|meduse|urgent|annul/i.test(descLower);
    const alertType =
      /ferry/i.test(descLower) ? "ferry" : /route|coupure/i.test(descLower) ? "route" : "autre";
    const { data: created } = await supabase
      .from("alerts")
      .insert({
        type: alertType,
        severity: breaking ? "alert" : "warning",
        title: sub.title,
        details,
        district,
        source_url: null,
        active: true,
        urgent: breaking,
      })
      .select("*")
      .single();
    if (created) {
      await dispatchAlertNotifications(created);
      revalidateAlertPublicPaths();
    }
  } else if (sub.type === "suggestion") {
    /* suggestion sans publication auto */
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
/** Recopie les horaires du catalogue JSON vers les fiches Supabase (match par nom). */
export async function syncRestaurantHoursFromCatalog(): Promise<{
  updated: number;
  names: string[];
}> {
  await requireAdmin();
  const { backfillRestaurantHoursFromCatalog } = await import(
    "@/lib/supabase/sync-restaurants"
  );
  const result = await backfillRestaurantHoursFromCatalog();
  if (result.error) throw new Error(result.error);
  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
  return { updated: result.updated, names: result.names };
}

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

/** Importe les hébergements du JSON catalogue (admin, 1 clic). */
export async function importAccommodationsFromCatalog() {
  await requireAdmin();
  const result = await importMissingAccommodationsFromJson();
  revalidatePath("/admin/accommodations");
  revalidatePath("/hebergements");
  revalidatePath("/visiteurs");
  return result;
}
