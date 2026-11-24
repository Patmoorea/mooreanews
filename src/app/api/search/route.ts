import { NextResponse } from "next/server";
import { searchAll } from "@/lib/search";

/** Recherche déclenchée par le navigateur. La page /recherche reste statique. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json(
      { results: [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const results = await searchAll(q);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
