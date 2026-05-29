import { NextResponse } from "next/server";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function fulfillSession(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  const targetId = session.metadata?.target_id;
  if (!kind || !targetId) return;

  const admin = getAdminSupabase();
  if (!admin) return;

  const now = new Date();

  if (kind === "announcement_boost") {
    const until = new Date(now);
    until.setDate(until.getDate() + STRIPE_PRICES.boostDays);
    await admin
      .from("announcements")
      .update({
        boosted_until: until.toISOString(),
        stripe_session_id: session.id,
      })
      .eq("id", targetId);
    revalidatePath("/annonces");
    revalidatePath(`/annonces/${targetId}`);
  }

  if (kind === "restaurant_premium") {
    const until = new Date(now);
    until.setDate(until.getDate() + STRIPE_PRICES.premiumDays);
    await admin
      .from("restaurants")
      .update({
        premium_until: until.toISOString(),
        featured: true,
      })
      .eq("id", targetId);
    revalidatePath("/restaurants");
    revalidatePath(`/restaurants/${targetId}`);
  }

  await admin
    .from("commerce_payments")
    .update({ status: "completed", completed_at: now.toISOString() })
    .eq("stripe_session_id", session.id);
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      await fulfillSession(session);
    }
  }

  return NextResponse.json({ received: true });
}
