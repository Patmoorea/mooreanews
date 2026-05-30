import { NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/admin-auth";
import { searchPlacesOnMoorea } from "@/lib/google-places";

export async function GET(req: Request) {
  const auth = await requireStaffSession();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ places: [] });
  }

  const places = await searchPlacesOnMoorea(q);
  return NextResponse.json({ places });
}
