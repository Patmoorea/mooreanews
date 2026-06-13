import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { aggregateFacebookPagesGraph } from "@/lib/facebook-watch";
import { facebookCronRecentPostLimit } from "@/lib/facebook-import-filters";
import { countFbcdnCoversInDb } from "@/lib/facebook-cover-persist";
import { getFacebookImportStatus } from "@/lib/facebook-import-status";
import { notifyFacebookImportReport } from "@/lib/telegram-notify";
import { syncUtilityOutages } from "@/lib/utility-outages-sync";

/** Import Facebook MooreaNews — répond 202 puis traite en arrière-plan (évite timeout ~60 s). */
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

async function runFacebookImport(forcePhotoFbids?: string[]) {
  const start = Date.now();
  const result = await aggregateFacebookPagesGraph({
    light: true,
    recentImportLimit: facebookCronRecentPostLimit(),
    forcePhotoFbids:
      forcePhotoFbids && forcePhotoFbids.length > 0
        ? forcePhotoFbids
        : undefined,
  });
  const utilityOutages = await syncUtilityOutages();
  const fbcdnRemaining = await countFbcdnCoversInDb();
  const warnings = result.warnings ?? [];
  const errors = result.errors ?? [];
  const durationMs = Date.now() - start;

  const articles =
    (result.articlesCreated ?? 0) + (result.articlesRepaired ?? 0);
  if (
    articles > 0 ||
    utilityOutages.created > 0 ||
    utilityOutages.updated > 0
  ) {
    revalidatePath("/actualites");
    revalidatePath("/alertes");
    revalidatePath("/coupures");
    revalidatePath("/", "layout");
  }

  await notifyFacebookImportReport({
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

  return {
    ok:
      errors.length === 0 &&
      warnings.length === 0 &&
      fbcdnRemaining === 0,
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
    mode: "light" as const,
    recentLimit: facebookCronRecentPostLimit(),
    forcePhotoFbids:
      forcePhotoFbids && forcePhotoFbids.length > 0
        ? forcePhotoFbids
        : undefined,
    importProcessed: result.importProcessed ?? facebookCronRecentPostLimit(),
    graphFetched: result.fetched,
    fbcdnRemaining,
    coversPersisted: result.coversPersisted ?? 0,
    coversFailed: result.coversFailed ?? 0,
    warnings,
    status: await getFacebookImportStatus(5),
    utilityOutages,
    ...result,
  };
}

export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const wait = url.searchParams.get("wait") === "1";
  const forcePhotoFbids = [
    ...url.searchParams.getAll("fbid"),
    ...(url.searchParams.get("fbids")?.split(/[,;\s]+/) ?? []),
  ]
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));

  if (!wait) {
    after(async () => {
      try {
        await runFacebookImport(
          forcePhotoFbids.length > 0 ? forcePhotoFbids : undefined,
        );
      } catch (err) {
        console.error("[cron/facebook async]", err);
      }
    });

    return NextResponse.json(
      {
        ok: true,
        started: true,
        async: true,
        recentLimit: facebookCronRecentPostLimit(),
        hint: "Import Facebook en cours (~1–3 min). Ajouter wait=1 pour attendre le JSON complet.",
      },
      { status: 202 },
    );
  }

  try {
    const payload = await runFacebookImport(
      forcePhotoFbids.length > 0 ? forcePhotoFbids : undefined,
    );
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/facebook]", message);
    return NextResponse.json(
      { ok: false, error: message.slice(0, 500) },
      { status: 500 },
    );
  }
}

export const POST = GET;
