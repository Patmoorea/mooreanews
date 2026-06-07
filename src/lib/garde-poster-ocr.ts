/**
 * OCR affiche garde commune — cron uniquement (jamais pages visiteurs).
 *
 * Vercel : WASM + worker + lang embarqués (voir next.config + vercel.json).
 */

import path from "path";

const OCR_TIMEOUT_MS = 45_000;
const MIN_TEXT_LEN = 40;

export type GardeOcrResult = {
  ok: boolean;
  text: string | null;
  error?: string;
  durationMs?: number;
};

function ocrEnabled(): boolean {
  return process.env.GARDE_OCR_ENABLED !== "false";
}

function tesseractPaths() {
  const root = process.cwd();
  return {
    workerPath: path.join(
      root,
      "node_modules/tesseract.js/src/worker-script/node/index.js",
    ),
    corePath: path.join(root, "node_modules/tesseract.js-core/"),
    langPath: path.join(root, "data/ocr"),
    cachePath: "/tmp/moorea-tesseract",
  };
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "image/*",
        "User-Agent":
          "MooreaNews/1.0 (+https://www.mooreanews.com; garde OCR cron)",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500 || buf.length > 5 * 1024 * 1024) return null;
    return buf;
  } catch {
    return null;
  }
}

async function runOcr(buffer: Buffer): Promise<{ text: string | null; error?: string }> {
  const { createWorker } = await import("tesseract.js");
  const paths = tesseractPaths();

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    worker = await createWorker("fra", 1, {
      ...paths,
      gzip: true,
      workerBlobURL: false,
      logger: () => {},
      errorHandler: (err: unknown) => {
        console.error("[garde-ocr] worker error:", err);
      },
    });

    const { data } = await worker.recognize(buffer);
    const text = data.text?.trim() ?? "";
    if (text.length < MIN_TEXT_LEN) {
      return { text: null, error: `texte trop court (${text.length} car.)` };
    }
    return { text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { text: null, error: msg.slice(0, 280) };
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
}

/** Lit le texte d'une affiche garde (URL Facebook ou /public). */
export async function ocrGardePosterImage(imageUrl: string): Promise<GardeOcrResult> {
  const t0 = Date.now();

  if (!ocrEnabled()) {
    return { ok: false, text: null, error: "GARDE_OCR_ENABLED=false", durationMs: 0 };
  }
  if (!imageUrl?.trim()) {
    return { ok: false, text: null, error: "url vide", durationMs: 0 };
  }

  let buffer: Buffer | null = null;
  if (imageUrl.startsWith("/")) {
    const { readFile } = await import("fs/promises");
    const filePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
    buffer = await readFile(filePath).catch(() => null);
    if (!buffer) {
      return {
        ok: false,
        text: null,
        error: `fichier local introuvable: ${imageUrl}`,
        durationMs: Date.now() - t0,
      };
    }
  } else {
    buffer = await fetchImageBuffer(imageUrl);
    if (!buffer) {
      return {
        ok: false,
        text: null,
        error: `téléchargement image échoué: ${imageUrl.slice(0, 120)}`,
        durationMs: Date.now() - t0,
      };
    }
  }

  try {
    const result = await Promise.race([
      runOcr(buffer),
      new Promise<{ text: null; error: string }>((_, reject) =>
        setTimeout(() => reject(new Error("ocr_timeout")), OCR_TIMEOUT_MS),
      ),
    ]);

    return {
      ok: Boolean(result.text),
      text: result.text,
      error: result.error,
      durationMs: Date.now() - t0,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      text: null,
      error: msg.slice(0, 280),
      durationMs: Date.now() - t0,
    };
  }
}
