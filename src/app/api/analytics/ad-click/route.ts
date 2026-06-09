import { NextResponse } from "next/server";

/** Enregistrement léger des clics encarts partenaires (logs Vercel). */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      slotId?: string;
      campaignId?: string;
      path?: string;
    };
    if (body.slotId && body.campaignId) {
      console.info(
        "[ad-click]",
        JSON.stringify({
          slotId: body.slotId,
          campaignId: body.campaignId,
          path: body.path ?? null,
          at: new Date().toISOString(),
        }),
      );
    }
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
