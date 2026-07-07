import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCarpoolSignup } from "@/lib/carpool-signups";
import { checkPublicFormSpam } from "@/lib/spam-guard";
import { FORM_CORS_HEADERS, spamBlockedResponse } from "@/lib/spam-api-response";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { SITE } from "@/lib/constants";

const Payload = z.object({
  announcementId: z.string().uuid(),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(24),
  message: z.string().max(200).optional().default(""),
  consent: z.union([z.literal("on"), z.boolean()]).optional(),
});

const ERROR_MESSAGES: Record<string, string> = {
  full: "Plus de place sur ce trajet.",
  already_registered: "Vous êtes déjà inscrit sur ce trajet.",
  offer_expired: "Ce trajet n’est plus disponible.",
  offer_not_found: "Trajet introuvable.",
  signup_unavailable: "Inscription temporairement indisponible.",
};

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

  const spam = await checkPublicFormSpam(req, "covoiturage-signup", raw, {
    fields: [
      typeof raw.name === "string" ? raw.name : "",
      typeof raw.message === "string" ? raw.message : "",
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

  const result = await createCarpoolSignup({
    announcementId: parsed.announcementId,
    name: parsed.name,
    phone: parsed.phone,
    message: parsed.message,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        detail: ERROR_MESSAGES[result.error] ?? "Inscription impossible.",
      },
      { status: result.status, headers: FORM_CORS_HEADERS },
    );
  }

  const supabase = getAdminSupabase();
  let offerTitle = "Trajet";
  let offerAuthor = "";
  let offerContact = "";
  if (supabase) {
    const { data } = await supabase
      .from("announcements")
      .select("title, author, contact")
      .eq("id", parsed.announcementId)
      .maybeSingle();
    if (data) {
      offerTitle = data.title;
      offerAuthor = data.author ?? "";
      offerContact = data.contact ?? "";
    }
  }

  const pageUrl = `${SITE.url.replace(/\/$/, "")}/covoiturage`;
  await sendTelegramNotification(
    [
      "<b>🙋 Inscription covoiturage</b>",
      "",
      `<b>${escapeHtml(offerTitle)}</b>`,
      `Passager : ${escapeHtml(parsed.name)} · ${escapeHtml(parsed.phone)}`,
      parsed.message ? `Message : ${escapeHtml(parsed.message)}` : "",
      offerAuthor
        ? `Conducteur : ${escapeHtml(offerAuthor)} · ${escapeHtml(offerContact)}`
        : "",
      `Places restantes : ${result.seatsLeft}`,
      `<a href="${pageUrl}">Voir sur MooreaNews</a>`,
    ]
      .filter(Boolean)
      .join("\n"),
  ).catch(() => {});

  revalidatePath("/covoiturage");

  return NextResponse.json(
    {
      ok: true,
      seatsLeft: result.seatsLeft,
      message:
        result.seatsLeft > 0
          ? "Inscription enregistrée ! Le conducteur peut vous contacter."
          : "Inscription enregistrée ! Ce trajet est maintenant complet.",
    },
    { headers: FORM_CORS_HEADERS },
  );
}
