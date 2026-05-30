import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, siteBaseUrl, STRIPE_PRICES } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/supabase/admin";

const Body = z.object({ accommodationId: z.string().uuid() });

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

  let accommodationId: string;
  try {
    accommodationId = Body.parse(await req.json()).accommodationId;
  } catch {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const { data: acc } = await admin
    .from("accommodations")
    .select("id, name, published")
    .eq("id", accommodationId)
    .maybeSingle();

  if (!acc?.published) {
    return NextResponse.json({ error: "Hébergement introuvable" }, { status: 404 });
  }

  const base = siteBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: STRIPE_PRICES.accommodationPremiumEurCents,
          product_data: {
            name: "À la une visiteurs 30 jours — MooreaNews",
            description: acc.name,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "accommodation_premium",
      target_id: acc.id,
    },
    success_url: `${base}/commercant?accommodation_premium=success`,
    cancel_url: `${base}/commercant?accommodation_premium=cancel`,
  });

  await admin.from("commerce_payments").insert({
    kind: "accommodation_premium",
    target_id: acc.id,
    stripe_session_id: session.id,
    amount_cents: STRIPE_PRICES.accommodationPremiumEurCents,
    currency: "eur",
    status: "pending",
  });

  return NextResponse.json({ url: session.url });
}
