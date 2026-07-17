/**
 * OCR affiche garde commune — cron uniquement (jamais pages visiteurs).
 *
 * Vercel : WASM + worker + lang embarqués (voir next.config + vercel.json).
 */

import path from "path";

const MIN_TEXT_LEN = 40;

const OCR_RECOGNIZE_TIMEOUT_MS = Math.max(
  60_000,
  Number(process.env.GARDE_OCR_TIMEOUT_MS ?? 120_000) || 120_000,
);
const OCR_WORKER_INIT_TIMEOUT_MS = Math.max(
  45_000,
  Number(process.env.GARDE_OCR_WORKER_INIT_MS ?? 90_000) || 90_000,
);

export type GardeOcrResult = {
  ok: boolean;
  text: string | null;
  error?: string;
  durationMs?: number;
};

export function isGardeOcrEnabled(): boolean {
  // Sur Vercel, Tesseract dépasse quasi toujours le délai d'init (~90 s) et
  // consomme du CPU « Fluid Active » facturé pour rien. L'OCR tourne en local
  // (script de sync) pour alimenter le cache + data/garde-moorea.json ; en prod
  // on s'appuie sur ce cache. Réactivable via GARDE_OCR_ENABLED=true.
  if (process.env.GARDE_OCR_ENABLED === "true") return true;
  if (process.env.GARDE_OCR_ENABLED === "false") return false;
  return !process.env.VERCEL;
}

function ocrEnabled(): boolean {
  return isGardeOcrEnabled();
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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(label)), ms);
    }),
  ]);
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "image/*",
        "User-Agent":
          "MooreaNews/1.0 (+https://www.mooreanews.com; garde OCR cron)",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500 || buf.length > 5 * 1024 * 1024) return null;
    return buf;
  } catch {
    return null;
  }
}

async function loadImageBuffer(imageUrl: string): Promise<Buffer | null> {
  if (imageUrl.startsWith("/")) {
    const { readFile } = await import("fs/promises");
    const filePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
    return readFile(filePath).catch(() => null);
  }
  return fetchImageBuffer(imageUrl);
}

type OcrWorker = Awaited<
  ReturnType<(typeof import("tesseract.js"))["createWorker"]>
>;

/** Session OCR réutilisable — évite 2× le chargement Tesseract (cold start ~60–90 s). */
export class GardeOcrSession {
  private worker: OcrWorker | null = null;

  async init(): Promise<string | null> {
    if (this.worker) return null;

    try {
      const { createWorker, PSM } = await import("tesseract.js");
      const paths = tesseractPaths();

      this.worker = await withTimeout(
        createWorker("fra", 1, {
          ...paths,
          gzip: true,
          workerBlobURL: false,
          logger: () => {},
          errorHandler: (err: unknown) => {
            console.error("[garde-ocr] worker error:", err);
          },
        }),
        OCR_WORKER_INIT_TIMEOUT_MS,
        "ocr_worker_init_timeout",
      );

      await this.worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[garde-ocr] init failed:", msg);
      return msg.slice(0, 280);
    }
  }

  async recognizeBuffer(buffer: Buffer): Promise<{ text: string | null; error?: string }> {
    const initError = await this.init();
    if (initError || !this.worker) {
      return { text: null, error: initError ?? "worker OCR indisponible" };
    }

    try {
      const { data } = await withTimeout(
        this.worker.recognize(buffer),
        OCR_RECOGNIZE_TIMEOUT_MS,
        "ocr_timeout",
      );
      const text = data.text?.trim() ?? "";
      if (text.length < MIN_TEXT_LEN) {
        return { text: null, error: `texte trop court (${text.length} car.)` };
      }
      return { text };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { text: null, error: msg.slice(0, 280) };
    }
  }

  async recognizeImageUrl(imageUrl: string): Promise<GardeOcrResult> {
    const t0 = Date.now();
    const buffer = await loadImageBuffer(imageUrl);
    if (!buffer) {
      return {
        ok: false,
        text: null,
        error: imageUrl.startsWith("/")
          ? `fichier local introuvable: ${imageUrl}`
          : `téléchargement image échoué: ${imageUrl.slice(0, 120)}`,
        durationMs: Date.now() - t0,
      };
    }

    const result = await this.recognizeBuffer(buffer);
    return {
      ok: Boolean(result.text),
      text: result.text,
      error: result.error,
      durationMs: Date.now() - t0,
    };
  }

  async close(): Promise<void> {
    if (!this.worker) return;
    await this.worker.terminate().catch(() => {});
    this.worker = null;
  }
}

export async function withGardeOcrSession<T>(
  fn: (session: GardeOcrSession) => Promise<T>,
): Promise<T> {
  const session = new GardeOcrSession();
  try {
    return await fn(session);
  } finally {
    await session.close();
  }
}

/** Lit le texte d'une affiche garde (URL Facebook, COPPF ou /public). */
export async function ocrGardePosterImage(imageUrl: string): Promise<GardeOcrResult> {
  const t0 = Date.now();

  if (!ocrEnabled()) {
    return { ok: false, text: null, error: "GARDE_OCR_ENABLED=false", durationMs: 0 };
  }
  if (!imageUrl?.trim()) {
    return { ok: false, text: null, error: "url vide", durationMs: 0 };
  }

  return withGardeOcrSession(async (session) => {
    const result = await session.recognizeImageUrl(imageUrl);
    return { ...result, durationMs: Date.now() - t0 };
  });
}
