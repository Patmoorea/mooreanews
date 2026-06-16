import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { aggregateFacebookPagesGraph } from "@/lib/facebook-watch";
import { facebookCronRecentPostLimit } from "@/lib/facebook-import-filters";
import { countFbcdnCoversInDb } from "@/lib/facebook-cover-persist";
import { getFacebookImportStatus } from "@/lib/facebook-import-status";
import { notifyFacebookImportReport, notifyPublicNewArticles } from "@/lib/telegram-notify";
import { syncUtilityOutages } from "@/lib/utility-outages-sync";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { mooreaNewsGraphPageId } from "@/lib/facebook-mooreanews-id";

/** Import Facebook MooreaNews — veille GitHub : wait=1 synchrone (enrichissement complet). */
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

async function runFacebookImport(
  forcePhotoFbids?: string[],
  options?: {
    skipTelegram?: boolean;
    skipUtility?: boolean;
    skipStatus?: boolean;
    recentImportLimit?: number;
    newPostsOnly?: boolean;
    newPostsLimit?: number;
    repairOnly?: boolean;
  },
) {
  const start = Date.now();
  const recentLimit =
    options?.recentImportLimit ?? facebookCronRecentPostLimit();
  const result = await aggregateFacebookPagesGraph({
    light: true,
    recentImportLimit: recentLimit,
    newPostsOnly: options?.newPostsOnly === true,
    newPostsLimit: options?.newPostsLimit ?? recentLimit,
    repairOnly: options?.repairOnly === true,
    forcePhotoFbids:
      forcePhotoFbids && forcePhotoFbids.length > 0
        ? forcePhotoFbids
        : undefined,
  });
  const utilityOutages = options?.skipUtility
    ? { created: 0, updated: 0, cleared: 0, errors: [] as string[] }
    : await syncUtilityOutages();
  const fbcdnRemaining = options?.skipStatus
    ? 0
    : await countFbcdnCoversInDb();
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

  if (!options?.skipTelegram) {
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
  }

  const newForChannel = result.createdArticles ?? [];
  let telegramChannel = { sent: 0, failed: 0, errors: [] as string[] };
  if (newForChannel.length > 0) {
    telegramChannel = await notifyPublicNewArticles(newForChannel);
  }

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
    recentLimit,
    newPostsOnly: options?.newPostsOnly === true,
    repairOnly: options?.repairOnly === true,
    forcePhotoFbids:
      forcePhotoFbids && forcePhotoFbids.length > 0
        ? forcePhotoFbids
        : undefined,
    importProcessed: result.importProcessed ?? recentLimit,
    graphFetched: result.fetched,
    fbcdnRemaining,
    coversPersisted: result.coversPersisted ?? 0,
    coversFailed: result.coversFailed ?? 0,
    warnings,
    status: options?.skipStatus
      ? null
      : await getFacebookImportStatus(5),
    utilityOutages,
    telegramChannel,
    ...result,
  };
}

export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const wait = url.searchParams.get("wait") === "1";
  const chain = url.searchParams.get("chain") === "1";
  const repairOnly = url.searchParams.get("repairOnly") === "1";
  const forceReimport = url.searchParams.get("forceReimport") === "1";
  const newPostsOnly =
    !repairOnly &&
    !forceReimport &&
    forcePhotoFbids.length === 0 &&
    (url.searchParams.get("newOnly") === "1" ||
      url.searchParams.get("newPostsOnly") === "1" ||
      chain);
  const forcePhotoFbids = [
    ...url.searchParams.getAll("fbid"),
    ...(url.searchParams.get("fbids")?.split(/[,;\s]+/) ?? []),
  ]
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));

  if (!wait && !chain) {
    return NextResponse.json(
      {
        ok: false,
        error: "async_disabled",
        hint: "Ajouter wait=1 (veille GitHub) ou chain=1",
      },
      { status: 400 },
    );
  }

  try {
    const limitRaw = url.searchParams.get("limit");
    const newPostsLimit = limitRaw
      ? Math.min(Math.max(1, Math.floor(Number(limitRaw))), 10)
      : newPostsOnly
        ? 1
        : facebookCronRecentPostLimit();

    const importOptions = {
      skipTelegram: chain && !repairOnly && !forceReimport,
      skipUtility: chain,
      skipStatus: chain,
      recentImportLimit: Math.max(newPostsLimit, 25),
      newPostsOnly,
      newPostsLimit,
      repairOnly,
    };

    if (forceReimport && forcePhotoFbids.length > 0) {
      const supabase = getAdminSupabase();
      if (supabase) {
        const graphId = mooreaNewsGraphPageId();
        for (const fbid of forcePhotoFbids) {
          const slug = `mooreanews-fb-${graphId}-${fbid}`;
          await supabase.from("articles").delete().eq("slug", slug);
        }
      }
    }

    /** Sans wait=1 : async (tests manuels uniquement). Veille GitHub passe toujours wait=1. */
    if (!wait) {
      after(async () => {
        try {
          await runFacebookImport(
            forcePhotoFbids.length > 0 ? forcePhotoFbids : undefined,
            importOptions,
          );
        } catch (err) {
          console.error("[cron/facebook/async]", err);
        }
      });

      return NextResponse.json(
        {
          ok: true,
          started: true,
          async: true,
          newPostsOnly,
          repairOnly,
          newPostsLimit,
          hint: "Import Facebook en arrière-plan.",
        },
        { status: 202 },
      );
    }

    const payload = await runFacebookImport(
      forcePhotoFbids.length > 0 ? forcePhotoFbids : undefined,
      importOptions,
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
