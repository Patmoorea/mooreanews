import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";

const Body = z.object({
  accommodationId: z.string().uuid(),
  email: z.string().email(),
  status: z.enum(["available", "limited", "contact", "full"]),
});

export async function POST(req: Request) {
  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { data: acc } = await admin
    .from("accommodations")
    .select("id, name, merchant_email, published")
    .eq("id", body.accommodationId)
    .maybeSingle();

  if (!acc?.published) {
    return NextResponse.json({ error: "Hébergement introuvable" }, { status: 404 });
  }

  const registered = (acc.merchant_email ?? "").trim().toLowerCase();
  const provided = body.email.trim().toLowerCase();

  if (!registered) {
    return NextResponse.json(
      {
        error:
          "Email hébergeur non configuré — contactez MooreaNews pour lier votre fiche.",
      },
      { status: 403 },
    );
  }

  if (registered !== provided) {
    return NextResponse.json(
      { error: "Email non autorisé pour cet hébergement" },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("accommodations")
    .update({
      merchant_availability_status: body.status,
      merchant_availability_updated_at: now,
      availability_status: body.status,
    })
    .eq("id", body.accommodationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/hebergements");
  revalidatePath("/visiteurs");
  revalidatePath(`/hebergements/${acc.id}`);

  return NextResponse.json({ ok: true });
}
