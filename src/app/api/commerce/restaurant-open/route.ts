import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";

const Body = z.object({
  restaurantId: z.string().uuid(),
  email: z.string().email(),
  status: z.enum(["open", "closed"]),
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

  const { data: resto } = await admin
    .from("restaurants")
    .select("id, name, merchant_email, published")
    .eq("id", body.restaurantId)
    .maybeSingle();

  if (!resto?.published) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  const registered = (resto.merchant_email ?? "").trim().toLowerCase();
  const provided = body.email.trim().toLowerCase();

  if (!registered) {
    return NextResponse.json(
      {
        error:
          "Email commerçant non configuré — contactez MooreaNews pour lier votre fiche.",
      },
      { status: 403 },
    );
  }

  if (registered !== provided) {
    return NextResponse.json({ error: "Email non autorisé pour ce restaurant" }, { status: 403 });
  }

  const { error } = await admin
    .from("restaurants")
    .update({
      merchant_open_status: body.status,
      merchant_open_updated_at: new Date().toISOString(),
    })
    .eq("id", body.restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/restaurants");
  revalidatePath("/ce-soir");
  revalidatePath(`/restaurants/${body.restaurantId}`);

  return NextResponse.json({ ok: true });
}
