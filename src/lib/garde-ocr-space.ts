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
  const key =
    process.env.OCR_SPACE_API_KEY?.trim() ||
    process.env.OCRSPACE_API_KEY?.trim() ||
    process.env.OCR_SPACE_APIKEY?.trim() ||
    null;
  return key || null;
}

export type OcrSpaceOptions = {
  /** true (défaut) : lecture ligne par ligne du tableau ; false : texte libre (2e essai). */
  isTable?: boolean;
};

/** Type réel de l'image (les affiches COPPF sont tantôt PNG, tantôt captures JPG / WEBP). */
export function sniffImageType(buffer: Buffer): { mime: string; ext: string } {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mime: "image/png", ext: "png" };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  if (buffer.length >= 4 && buffer.toString("ascii", 0, 3) === "GIF") {
    return { mime: "image/gif", ext: "gif" };
  }
  return { mime: "image/jpeg", ext: "jpg" };
}

function isTransientOcrError(err: string | undefined): boolean {
  return Boolean(err && /HTTP 5\d\d|HTTP 429|timeout|timed out|aborted|fetch failed|ECONN|ETIMEDOUT|E101|E500/i.test(err));
}

/** 1 nouvel essai après une erreur réseau / serveur OCR.space (quota gratuit souvent saturé). */
async function withRetry(run: () => Promise<OcrSpaceResult>): Promise<OcrSpaceResult> {
  const first = await run();
  if (first.ok || !isTransientOcrError(first.error)) return first;
  await new Promise((r) => setTimeout(r, 3_000));
  const second = await run();
  return second.ok ? second : { ...second, error: `${second.error} (après 2 essais)` };
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
export async function ocrSpaceFromUrl(
  imageUrl: string,
  options: OcrSpaceOptions = {},
): Promise<OcrSpaceResult> {
  const apikey = ocrSpaceApiKey();
  if (!apikey) {
    return { ok: false, text: null, error: "OCR_SPACE_API_KEY manquant" };
  }
  return withRetry(() => ocrSpaceUrlOnce(apikey, imageUrl, options));
}

async function ocrSpaceUrlOnce(
  apikey: string,
  imageUrl: string,
  options: OcrSpaceOptions,
): Promise<OcrSpaceResult> {
  try {
    const form = new FormData();
    form.append("apikey", apikey);
    form.append("url", imageUrl);
    form.append("language", "fre");
    form.append("isOverlayRequired", "false");
    form.append("OCREngine", "2");
    form.append("scale", "true");
    form.append("detectOrientation", "true");
    // Lecture ligne par ligne du tableau officiel (évite la lecture colonne par colonne).
    form.append("isTable", options.isTable === false ? "false" : "true");

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
export async function ocrSpaceFromBuffer(
  buffer: Buffer,
  options: OcrSpaceOptions = {},
): Promise<OcrSpaceResult> {
  const apikey = ocrSpaceApiKey();
  if (!apikey) {
    return { ok: false, text: null, error: "OCR_SPACE_API_KEY manquant" };
  }
  return withRetry(() => ocrSpaceBufferOnce(apikey, buffer, options));
}

async function ocrSpaceBufferOnce(
  apikey: string,
  buffer: Buffer,
  options: OcrSpaceOptions,
): Promise<OcrSpaceResult> {
  try {
    const form = new FormData();
    form.append("apikey", apikey);
    form.append("language", "fre");
    form.append("isOverlayRequired", "false");
    form.append("OCREngine", "2");
    form.append("scale", "true");
    form.append("detectOrientation", "true");
    // Lecture ligne par ligne du tableau officiel (évite la lecture colonne par colonne).
    form.append("isTable", options.isTable === false ? "false" : "true");
    // Type réel (PNG / JPG / WEBP) : un PNG envoyé en image/jpeg peut être rejeté.
    const { mime, ext } = sniffImageType(buffer);
    // OCR.space n'accepte que PDF/GIF/PNG/JPG/TIF/BMP pour « filetype » (pas WEBP).
    if (ext !== "webp") form.append("filetype", ext.toUpperCase());
    form.append("file", new Blob([new Uint8Array(buffer)], { type: mime }), `garde.${ext}`);

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
