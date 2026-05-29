import { NextResponse } from "next/server";
import { sendMorningDigest } from "@/lib/morning-digest";

export const dynamic = "force-dynamic";

async function verifyAuth(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
    const url = new URL(req.url);
    if (url.searchParams.get("secret") === secret) return true;
    return false;
  }
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return process.env.NODE_ENV !== "production";
}

export async function GET(req: Request) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await sendMorningDigest();
  return NextResponse.json({ ok: true, ...result });
}
