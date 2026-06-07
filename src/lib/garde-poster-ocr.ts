/**
 * OCR affiche garde commune — cron uniquement (jamais pages visiteurs).
 */

const OCR_TIMEOUT_MS = 25_000;

function ocrEnabled(): boolean {
  return process.env.GARDE_OCR_ENABLED !== "false";
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500 || buf.length > 5 * 1024 * 1024) return null;
    return buf;
  } catch {
    return null;
  }
}

async function runOcr(buffer: Buffer): Promise<string | null> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra", 1, {
    logger: () => {},
  });
  try {
    const { data } = await worker.recognize(buffer);
    const text = data.text?.trim() ?? "";
    return text.length >= 40 ? text : null;
  } finally {
    await worker.terminate();
  }
}

/** Lit le texte d'une affiche garde (URL Facebook ou /public). */
export async function ocrGardePosterImage(imageUrl: string): Promise<string | null> {
  if (!ocrEnabled() || !imageUrl?.trim()) return null;

  let buffer: Buffer | null = null;
  if (imageUrl.startsWith("/")) {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    buffer = await readFile(join(process.cwd(), "public", imageUrl)).catch(
      () => null,
    );
  } else {
    buffer = await fetchImageBuffer(imageUrl);
  }

  if (!buffer) return null;

  try {
    return await Promise.race([
      runOcr(buffer),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("ocr_timeout")), OCR_TIMEOUT_MS),
      ),
    ]);
  } catch {
    return null;
  }
}
