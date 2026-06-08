import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { aggregateFacebookPagesGraph } from "@/lib/facebook-watch";
import { facebookCronRecentPostLimit } from "@/lib/facebook-import-filters";
import { countFbcdnCoversInDb } from "@/lib/facebook-cover-persist";
import { getFacebookImportStatus } from "@/lib/facebook-import-status";
import { notifyFacebookImportReport } from "@/lib/telegram-notify";

/** Rattrapage Facebook uniquement (évite le timeout du cron complet). */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function buildSummary(input: {
  articlesCreated: number;
  articlesRepaired: number;
  articlesSkipped: number;
  coversFailed: number;
  fbcdnRemaining: number;
  errors: string[];
  warnings: string[];
}): string {
  const parts: string[] = [];
  if (input.articlesCreated > 0) {
    parts.push(`${input.articlesCreated} article(s) créé(s)`);
  }
  if (input.articlesRepaired > 0) {
    parts.push(`${input.articlesRepaired} réparé(s)`);
  }
  if (input.coversFailed > 0) {
    parts.push(`${input.coversFailed} affiche(s) non copiée(s)`);
  }
  if (input.fbcdnRemaining > 0) {
    parts.push(
      `${input.fbcdnRemaining} fbcdn encore en base (invisibles sur le site)`,
    );
  }
  if (input.errors.length > 0) {
    parts.push(`${input.errors.length} erreur(s)`);
  }
  if (parts.length === 0) {
    return `Rien à faire — ${input.articlesSkipped} post(s) déjà OK.`;
  }
  return parts.join(" · ");
}

export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const start = Date.now();
  const url = new URL(req.url);
  const forcePhotoFbids = [
    ...url.searchParams.getAll("fbid"),
    ...(url.searchParams.get("fbids")?.split(/[,;\s]+/) ?? []),
  ]
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));

  const result = await aggregateFacebookPagesGraph({
    light: true,
    recentImportLimit: facebookCronRecentPostLimit(),
    forcePhotoFbids: forcePhotoFbids.length > 0 ? forcePhotoFbids : undefined,
  });
  const fbcdnRemaining = await countFbcdnCoversInDb();
  const warnings = result.warnings ?? [];
  const errors = result.errors ?? [];
  const durationMs = Date.now() - start;

  const articles =
    (result.articlesCreated ?? 0) + (result.articlesRepaired ?? 0);
  if (articles > 0) {
    revalidatePath("/actualites");
    revalidatePath("/coupures");
    revalidatePath("/", "layout");
  }

  const telegram = await notifyFacebookImportReport({
    durationMs,
    articlesCreated: result.articlesCreated ?? 0,
    articlesRepaired: result.articlesRepaired ?? 0,
    articlesSkipped: result.articlesSkipped ?? 0,
    coversPersisted: result.coversPersisted ?? 0,
    coversFailed: result.coversFailed ?? 0,
    fbcdnRemaining,
    errors,
    warnings,
  });

  const importStatus = await getFacebookImportStatus(5);

  const ok =
    errors.length === 0 &&
    warnings.length === 0 &&
    fbcdnRemaining === 0;

  return NextResponse.json({
    ok,
    summary: buildSummary({
      articlesCreated: result.articlesCreated ?? 0,
      articlesRepaired: result.articlesRepaired ?? 0,
      articlesSkipped: result.articlesSkipped ?? 0,
      coversFailed: result.coversFailed ?? 0,
      fbcdnRemaining,
      errors,
      warnings,
    }),
    durationMs,
    mode: "light",
    recentLimit: facebookCronRecentPostLimit(),
    forcePhotoFbids: forcePhotoFbids.length > 0 ? forcePhotoFbids : undefined,
    importProcessed: result.importProcessed ?? facebookCronRecentPostLimit(),
    graphFetched: result.fetched,
    fbcdnRemaining,
    coversPersisted: result.coversPersisted ?? 0,
    coversFailed: result.coversFailed ?? 0,
    warnings,
    telegram,
    status: {
      hint: importStatus.hint,
      incompleteArticles: importStatus.incompleteArticles,
      samples: importStatus.samples,
    },
    ...result,
  });
}

export const POST = GET;
