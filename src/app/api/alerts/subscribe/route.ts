import { NextResponse } from "next/server";
import { z } from "zod";
import { MOOREA_DISTRICTS } from "@/lib/constants";
import { saveAlertEmailSubscription } from "@/lib/push-notify";

const Payload = z.object({
  email: z.email(),
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
  const result = await saveAlertEmailSubscription(body.email, districts);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
