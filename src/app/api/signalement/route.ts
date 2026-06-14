import { NextResponse } from "next/server";
import { z } from "zod";
import { scheduleSignalementAiEnrichment } from "@/lib/ai-signalement-enrich";
import { createSignalementSubmission } from "@/lib/signalement-submit";

const Payload = z.object({
  categoryId: z.string().min(1),
  description: z.string().min(5).max(2000),
  district: z.string().optional(),
  location: z.string().optional(),
  name: z.string().max(100).optional(),
  contact: z.string().min(3).max(120),
  coverUrl: z
    .string()
    .optional()
    .transform((s) => s?.trim() ?? "")
    .refine((s) => !s || /^https?:\/\//i.test(s) || s.startsWith("/"), {
      message: "coverUrl invalide",
    }),
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  let parsed: z.infer<typeof Payload>;
  try {
    const body = await req.json();
    parsed = Payload.parse(body);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const input = {
    categoryId: parsed.categoryId,
    description: parsed.description,
    district: parsed.district,
    location: parsed.location,
    name: parsed.name,
    contact: parsed.contact,
    coverUrl: parsed.coverUrl || null,
    sourceChannel: "web" as const,
  };

  const result = await createSignalementSubmission(input);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, warnings: result.warnings },
      {
        status: result.error === "missing_photo" ? 400 : 503,
        headers: CORS_HEADERS,
      },
    );
  }

  if (result.submissionId) {
    scheduleSignalementAiEnrichment(result.submissionId, input);
  }

  return NextResponse.json(
    { ok: true, submissionId: result.submissionId, warnings: result.warnings },
    { headers: CORS_HEADERS },
  );
}
