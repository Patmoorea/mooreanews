import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push-notify";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { ok: false, error: "push_not_configured", missing: "VAPID_PUBLIC_KEY" },
      { status: 503 },
    );
  }
  return NextResponse.json({
    ok: true,
    publicKey,
    privateKeyConfigured: Boolean(process.env.VAPID_PRIVATE_KEY?.trim()),
  });
}
