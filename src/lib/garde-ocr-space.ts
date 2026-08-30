/**
 * OCR en ligne (OCR.space) — rapide, fiable sur Vercel et GitHub Actions.
 * Gratuit : 500 req/jour — https://ocr.space/ocrapi
 */

const OCR_SPACE_URL = "https://api.ocr.space/parse/image";

export type OcrSpaceResult = {
  ok: boolean;
  text: string | null;
  error?: string;
};

function ocrSpaceApiKey(): string | null {
  const key = process.env.OCR_SPACE_API_KEY?.trim();
  return key || null;
}

export function isOcrSpaceEnabled(): boolean {
  return Boolean(ocrSpaceApiKey());
}

async function parseOcrSpaceResponse(res: Response): Promise<OcrSpaceResult> {
  if (!res.ok) {
    return { ok: false, text: null, error: `OCR.space HTTP ${res.status}` };
  }

  const data = (await res.json()) as {
    OCRExitCode?: number;
    ErrorMessage?: string | string[];
    ParsedResults?: { ParsedText?: string }[];
  };

  if (data.OCRExitCode !== 1) {
    const err = Array.isArray(data.ErrorMessage)
      ? data.ErrorMessage.join("; ")
      : data.ErrorMessage ?? `OCR.space exit ${data.OCRExitCode}`;
    return { ok: false, text: null, error: err.slice(0, 280) };
  }

  const text = (data.ParsedResults ?? [])
    .map((r) => r.ParsedText?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (text.length < 40) {
    return { ok: false, text: null, error: `texte trop court (${text.length} car.)` };
  }

  return { ok: true, text };
}

/** OCR via URL publique (affiche COPPF, Facebook…). */
export async function ocrSpaceFromUrl(imageUrl: string): Promise<OcrSpaceResult> {
  const apikey = ocrSpaceApiKey();
  if (!apikey) {
    return { ok: false, text: null, error: "OCR_SPACE_API_KEY manquant" };
  }

  try {
    const form = new FormData();
    form.append("apikey", apikey);
    form.append("url", imageUrl);
    form.append("language", "fre");
    form.append("isOverlayRequired", "false");
    form.append("OCREngine", "2");
    form.append("scale", "true");
    form.append("detectOrientation", "true");

    const res = await fetch(OCR_SPACE_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(45_000),
    });

    return parseOcrSpaceResponse(res);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, text: null, error: msg.slice(0, 280) };
  }
}

/** OCR via buffer (fichier local). */
export async function ocrSpaceFromBuffer(buffer: Buffer): Promise<OcrSpaceResult> {
  const apikey = ocrSpaceApiKey();
  if (!apikey) {
    return { ok: false, text: null, error: "OCR_SPACE_API_KEY manquant" };
  }

  try {
    const form = new FormData();
    form.append("apikey", apikey);
    form.append("language", "fre");
    form.append("isOverlayRequired", "false");
    form.append("OCREngine", "2");
    form.append("scale", "true");
    form.append("detectOrientation", "true");
    form.append(
      "file",
      new Blob([new Uint8Array(buffer)], { type: "image/jpeg" }),
      "garde.jpg",
    );

    const res = await fetch(OCR_SPACE_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(45_000),
    });

    return parseOcrSpaceResponse(res);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, text: null, error: msg.slice(0, 280) };
  }
}
