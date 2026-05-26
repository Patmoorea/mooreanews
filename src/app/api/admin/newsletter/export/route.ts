import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase)
    return NextResponse.json({ error: "not_configured" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor"))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: subs } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  const header = "email,confirmed,source,created_at,confirmed_at,unsubscribed_at";
  const rows =
    subs?.map((s) =>
      [
        s.email,
        s.confirmed ? "true" : "false",
        s.source ?? "",
        s.created_at,
        s.confirmed_at ?? "",
        s.unsubscribed_at ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ) ?? [];

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
