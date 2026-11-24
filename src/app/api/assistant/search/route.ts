import { NextResponse } from "next/server";
import { searchLocalAssistant } from "@/lib/local-assistant";

/** Assistant déclenché par le navigateur. La page /assistant reste statique. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json(
      { hits: [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const { hits } = await searchLocalAssistant(q);
  return NextResponse.json(
    {
      hits: hits.map((h) => ({
        kind: h.kind,
        title: h.title,
        excerpt: h.excerpt,
        href: h.href,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
