import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  buildCarpoolBody,
  buildCarpoolTitle,
  carpoolExpiresAt,
  CARPOOL_DIRECTIONS,
  CARPOOL_MEETING_POINTS,
  type CarpoolDirection,
} from "@/lib/covoiturage";
import { checkPublicFormSpam } from "@/lib/spam-guard";
import { FORM_CORS_HEADERS, spamBlockedResponse } from "@/lib/spam-api-response";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { SITE } from "@/lib/constants";

const Payload = z.object({
  direction: z.enum([
    "moorea-tahiti",
    "tahiti-moorea",
    "moorea-quai",
  ] as const satisfies readonly CarpoolDirection[]),
  tripDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().min(4).max(8),
  seats: z.coerce.number().int().min(1).max(8),
  meetingPoint: z.string().min(2).max(120),
  destination: z.string().min(2).max(120),
  priceShare: z.string().max(80).optional().default(""),
  notes: z.string().max(400).optional().default(""),
  author: z.string().min(2).max(80),
  phone: z.string().min(6).max(24),
  consent: z.union([z.literal("on"), z.boolean()]).optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: FORM_CORS_HEADERS });
}

export async function POST(req: Request) {
  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400, headers: FORM_CORS_HEADERS },
    );
  }

  const spam = await checkPublicFormSpam(req, "covoiturage", raw, {
    fields: [
      typeof raw.author === "string" ? raw.author : "",
      typeof raw.notes === "string" ? raw.notes : "",
      typeof raw.phone === "string" ? raw.phone : "",
    ],
  });
  if (!spam.allowed) return spamBlockedResponse(spam);

  let parsed: z.infer<typeof Payload>;
  try {
    parsed = Payload.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload", detail: String(err) },
      { status: 400, headers: FORM_CORS_HEADERS },
    );
  }

  const tripDay = new Date(`${parsed.tripDate}T12:00:00-10:00`);
  const todayTahiti = new Date().toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
  if (parsed.tripDate < todayTahiti) {
    return NextResponse.json(
      { ok: false, error: "past_date", detail: "La date du trajet est passée." },
      { status: 400, headers: FORM_CORS_HEADERS },
    );
  }
  if (Number.isNaN(tripDay.getTime())) {
    return NextResponse.json(
      { ok: false, error: "invalid_date" },
      { status: 400, headers: FORM_CORS_HEADERS },
    );
  }

  const input = {
    direction: parsed.direction,
    tripDate: parsed.tripDate,
    time: parsed.time,
    seats: parsed.seats,
    meetingPoint: parsed.meetingPoint,
    destination: parsed.destination,
    priceShare: parsed.priceShare,
    notes: parsed.notes,
    author: parsed.author.trim(),
    phone: parsed.phone.trim(),
  };

  const title = buildCarpoolTitle(input);
  const body = buildCarpoolBody(input);
  const expiresAt = carpoolExpiresAt(parsed.tripDate);

  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 503, headers: FORM_CORS_HEADERS },
    );
  }

  const { data: created, error } = await supabase
    .from("announcements")
    .insert({
      title,
      body,
      category: "covoiturage",
      district: parsed.meetingPoint.includes("Vaiare")
        ? "Vaiare"
        : parsed.meetingPoint.split(" ")[0],
      contact: parsed.phone,
      author: parsed.author,
      published: true,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "insert_failed" },
      { status: 500, headers: FORM_CORS_HEADERS },
    );
  }

  const pageUrl = `${SITE.url.replace(/\/$/, "")}/covoiturage`;
  const dirLabel =
    CARPOOL_DIRECTIONS.find((d) => d.value === parsed.direction)?.label ??
    parsed.direction;

  await sendTelegramNotification(
    [
      "<b>🚗 Nouveau covoiturage ferry</b>",
      "",
      `<b>${escapeHtml(title)}</b>`,
      escapeHtml(body.split("\n").slice(0, 6).join("\n")),
      "",
      `👤 ${escapeHtml(parsed.author)} · 📞 ${escapeHtml(parsed.phone)}`,
      `<a href="${pageUrl}">Voir sur MooreaNews</a>`,
    ].join("\n"),
  ).catch(() => {});

  revalidatePath("/covoiturage");
  revalidatePath("/annonces");
  revalidatePath("/", "layout");

  return NextResponse.json(
    {
      ok: true,
      id: created.id,
      title,
      direction: dirLabel,
      pageUrl,
    },
    { headers: FORM_CORS_HEADERS },
  );
}
