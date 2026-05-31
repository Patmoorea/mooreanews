import { NextResponse } from "next/server";
import { searchLocalGuide } from "@/lib/local-guide-search";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }
  const { hits } = await searchLocalGuide(q);
  return NextResponse.json({
    results: hits.map((h) => ({
      kind: h.kind,
      title: h.title,
      excerpt: h.excerpt,
      href: h.href,
      source: h.kind === "faq" ? "Qui sait quoi" : "Infos pratiques",
    })),
  });
}
