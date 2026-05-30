"use server";

import { revalidatePath } from "next/cache";
import { sendTestPushNotification } from "@/lib/push-notify";
import { getServerSupabase } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor"))
    throw new Error("Forbidden");
}

export async function adminSendTestPush(): Promise<{
  sent: number;
  errors: string[];
}> {
  await requireAdmin();
  const result = await sendTestPushNotification();
  revalidatePath("/admin/setup");
  return result;
}
