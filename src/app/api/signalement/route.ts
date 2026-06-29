import { NextResponse } from "next/server";
import { z } from "zod";
import { scheduleSignalementAiEnrichment } from "@/lib/ai-signalement-enrich";
import { checkPublicFormSpam } from "@/lib/spam-guard";
import { FORM_CORS_HEADERS, spamBlockedResponse } from "@/lib/spam-api-response";
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: FORM_CORS_HEADERS });
}

export async function POST(req: Request) {
  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400, headers: FORM_CORS_HEADERS },
    );
  }

  const spam = await checkPublicFormSpam(req, "signalement", raw, {
    email: typeof raw.contact === "string" && raw.contact.includes("@")
      ? raw.contact
      : undefined,
    fields: [
      typeof raw.description === "string" ? raw.description : "",
      typeof raw.location === "string" ? raw.location : "",
      typeof raw.name === "string" ? raw.name : "",
    ],
  });
  if (!spam.allowed) return spamBlockedResponse(spam);

  let parsed: z.infer<typeof Payload>;
  try {
    parsed = Payload.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400, headers: FORM_CORS_HEADERS },
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
        headers: FORM_CORS_HEADERS,
      },
    );
  }

  if (result.submissionId) {
    scheduleSignalementAiEnrichment(result.submissionId, input);
  }

  return NextResponse.json(
    { ok: true, submissionId: result.submissionId, warnings: result.warnings },
    { headers: FORM_CORS_HEADERS },
  );
}
