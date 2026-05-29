import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPageView } from "@/lib/page-analytics";

const Payload = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(500).optional(),
  visitorId: z.string().max(64).optional(),
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
