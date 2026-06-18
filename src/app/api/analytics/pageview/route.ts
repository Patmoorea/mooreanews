import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPageView } from "@/lib/page-analytics";

const Payload = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(500).optional(),
  visitorId: z.string().max(64).optional(),
  deviceType: z
    .enum(["mobile", "desktop", "tablet", "unknown"])
    .optional(),
  utm: z
    .object({
      source: z.string().max(64),
      medium: z.string().max(64).optional(),
      campaign: z.string().max(128).optional(),
      content: z.string().max(128).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const body = Payload.parse(await req.json());
    await recordPageView(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
