import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, siteBaseUrl, STRIPE_PRICES } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/supabase/admin";

const Body = z.object({ announcementId: z.string().uuid() });

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Paiement non configuré (STRIPE_SECRET_KEY)" },
      { status: 503 },
    );
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "Base indisponible" }, { status: 503 });
  }

  let announcementId: string;
  try {
    announcementId = Body.parse(await req.json()).announcementId;
  } catch {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const { data: ann } = await admin
    .from("announcements")
    .select("id, title, published")
    .eq("id", announcementId)
    .maybeSingle();

  if (!ann?.published) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  const base = siteBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: STRIPE_PRICES.announcementBoostEurCents,
          product_data: {
            name: `Boost annonce 7 jours — MooreaNews`,
            description: ann.title.slice(0, 200),
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "announcement_boost",
      target_id: ann.id,
    },
    success_url: `${base}/annonces/${ann.id}?boost=success`,
    cancel_url: `${base}/annonces/${ann.id}?boost=cancel`,
  });

  await admin.from("commerce_payments").insert({
    kind: "announcement_boost",
    target_id: ann.id,
    stripe_session_id: session.id,
    amount_cents: STRIPE_PRICES.announcementBoostEurCents,
    currency: "eur",
    status: "pending",
  });

  return NextResponse.json({ url: session.url });
}
