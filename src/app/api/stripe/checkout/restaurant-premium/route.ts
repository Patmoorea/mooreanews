import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, siteBaseUrl, STRIPE_PRICES } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/supabase/admin";

const Body = z.object({ restaurantId: z.string().uuid() });

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

  let restaurantId: string;
  try {
    restaurantId = Body.parse(await req.json()).restaurantId;
  } catch {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const { data: resto } = await admin
    .from("restaurants")
    .select("id, name, published")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!resto?.published) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  const base = siteBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "xpf",
          unit_amount: STRIPE_PRICES.restaurantPremiumXpf,
          product_data: {
            name: `Premium commerçant 30 jours — MooreaNews`,
            description: `${resto.name} (${STRIPE_PRICES.restaurantPremiumXpf.toLocaleString("fr-FR")} F CFP)`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "restaurant_premium",
      target_id: resto.id,
    },
    success_url: `${base}/commercant?premium=success`,
    cancel_url: `${base}/commercant?premium=cancel`,
  });

  await admin.from("commerce_payments").insert({
    kind: "restaurant_premium",
    target_id: resto.id,
    stripe_session_id: session.id,
    amount_cents: STRIPE_PRICES.restaurantPremiumXpf,
    currency: "xpf",
    status: "pending",
  });

  return NextResponse.json({ url: session.url });
}
