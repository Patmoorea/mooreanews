import { NextResponse } from "next/server";
import { z } from "zod";
import { MOOREA_DISTRICTS } from "@/lib/constants";
import { savePushSubscription } from "@/lib/push-notify";

const Payload = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  districts: z.array(z.string()).optional(),
});

const VALID_DISTRICTS = new Set<string>(MOOREA_DISTRICTS);

export async function POST(req: Request) {
  let body: z.infer<typeof Payload>;
  try {
    body = Payload.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const districts = (body.districts ?? []).filter((d) => VALID_DISTRICTS.has(d));
  const ua = req.headers.get("user-agent") ?? undefined;

  const result = await savePushSubscription(
    { ...body.subscription, districts },
    ua,
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, districts });
}
