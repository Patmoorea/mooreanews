import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyAccountSignup } from "@/lib/telegram-notify";

const Payload = z.object({
  email: z.email(),
  fullName: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Payload.parse(body);
    await notifyAccountSignup({
      email: parsed.email,
      fullName: parsed.fullName,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
