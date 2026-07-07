import { getAdminSupabase } from "@/lib/supabase/admin";

export type CarpoolSignupInput = {
  announcementId: string;
  name: string;
  phone: string;
  message?: string;
};

export async function getCarpoolSignupCounts(
  announcementIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (announcementIds.length === 0) return counts;

  const supabase = getAdminSupabase();
  if (!supabase) return counts;

  const { data, error } = await supabase
    .from("carpool_signups")
    .select("announcement_id")
    .in("announcement_id", announcementIds);

  if (error || !data) return counts;

  for (const row of data) {
    counts[row.announcement_id] = (counts[row.announcement_id] ?? 0) + 1;
  }
  return counts;
}

export async function createCarpoolSignup(
  input: CarpoolSignupInput,
): Promise<
  | { ok: true; seatsLeft: number }
  | { ok: false; error: string; status: number }
> {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { ok: false, error: "not_configured", status: 503 };
  }

  const { data: offer, error: offerError } = await supabase
    .from("announcements")
    .select("id, title, body, category, contact, author, published, expires_at")
    .eq("id", input.announcementId)
    .maybeSingle();

  if (offerError || !offer) {
    return { ok: false, error: "offer_not_found", status: 404 };
  }
  if (offer.category !== "covoiturage" || !offer.published) {
    return { ok: false, error: "offer_not_found", status: 404 };
  }
  if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "offer_expired", status: 410 };
  }

  const seatsMatch = offer.body.match(/Places disponibles\s*:\s*(\d+)/i);
  const maxSeats = Number(seatsMatch?.[1] ?? "1");
  const seats = Number.isFinite(maxSeats) && maxSeats > 0 ? maxSeats : 1;

  const { count, error: countError } = await supabase
    .from("carpool_signups")
    .select("id", { count: "exact", head: true })
    .eq("announcement_id", input.announcementId);

  if (countError) {
    return { ok: false, error: "signup_unavailable", status: 503 };
  }

  const current = count ?? 0;
  if (current >= seats) {
    return {
      ok: false,
      error: "full",
      status: 409,
    };
  }

  const phone = input.phone.trim();
  const { error: insertError } = await supabase.from("carpool_signups").insert({
    announcement_id: input.announcementId,
    name: input.name.trim(),
    phone,
    message: input.message?.trim() || null,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        ok: false,
        error: "already_registered",
        status: 409,
      };
    }
    return { ok: false, error: insertError.message, status: 500 };
  }

  return { ok: true, seatsLeft: Math.max(0, seats - current - 1) };
}
