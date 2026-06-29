import { NextResponse } from "next/server";
import type { SpamVerdict } from "@/lib/spam-guard";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function spamBlockedResponse(
  verdict: Extract<SpamVerdict, { allowed: false }>,
): NextResponse {
  if (verdict.silent) {
    return NextResponse.json({ ok: true }, { status: 200, headers: CORS });
  }
  return NextResponse.json(
    {
      ok: false,
      error:
        verdict.status === 429
          ? "too_many_requests"
          : "rejected",
    },
    { status: verdict.status, headers: CORS },
  );
}

export const FORM_CORS_HEADERS = CORS;
