import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Client Supabase service-role (bypass RLS).
 * À utiliser UNIQUEMENT côté serveur pour les opérations administratives
 * (seed, jobs cron, notifications transactionnelles).
 * NE JAMAIS exposer côté client.
 */
export function getAdminSupabase(): SupabaseClient<Database> | null {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
