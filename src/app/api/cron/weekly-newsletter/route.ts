import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getTahitiClock, shouldSendWeeklyNewsletter } from "@/lib/cron-tahiti";
import { sendWeeklyNewsletter } from "@/lib/weekly-newsletter";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Newsletter abonnés — dimanche 18h Tahiti : semaine suivante. */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const preview = url.searchParams.get("preview") === "1";
  const testEmail = url.searchParams.get("test")?.trim().toLowerCase();
  const clock = getTahitiClock();

  if (preview) {
    const { gatherWeeklyNewsletterData, buildWeeklyNewsletterHtml } =
      await import("@/lib/weekly-newsletter");
    const data = await gatherWeeklyNewsletterData();
    const html = buildWeeklyNewsletterHtml(data);
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (testEmail) {
    try {
      const result = await sendWeeklyNewsletter({ testTo: [testEmail] });
      return NextResponse.json({
        ok: true,
        tahiti: clock.label,
        test: testEmail,
        ...result,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[cron/weekly-newsletter/test]", message);
      return NextResponse.json(
        { ok: false, error: message.slice(0, 500), tahiti: clock.label },
        { status: 500 },
      );
    }
  }

  if (!force && !shouldSendWeeklyNewsletter(clock)) {
    return NextResponse.json({
      skipped: true,
      reason: "hors créneau dimanche 18h Tahiti",
      tahiti: clock.label,
    });
  }

  try {
    const result = await sendWeeklyNewsletter();
    return NextResponse.json({
      ok: true,
      tahiti: clock.label,
      forced: force,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/weekly-newsletter]", message);
    return NextResponse.json(
      { ok: false, error: message.slice(0, 500), tahiti: clock.label },
      { status: 500 },
    );
  }
}

export const POST = GET;
