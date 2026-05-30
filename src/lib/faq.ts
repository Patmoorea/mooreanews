/**
 * FAQ « Qui sait quoi » — base curatée avec repli JSON local.
 */

import faqSeed from "../../data/faq-entries.json";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { FaqEntryRow } from "@/lib/supabase/types";

export type FaqEntry = {
  slug: string;
  question: string;
  answer: string;
  category: string;
  source_label?: string | null;
  source_url?: string | null;
  district?: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Général",
  sante: "Santé",
  transport: "Transport",
  demarches: "Démarches",
  services: "Services",
};

export function faqCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function fromRow(row: FaqEntryRow): FaqEntry {
  return {
    slug: row.slug,
    question: row.question,
    answer: row.answer,
    category: row.category,
    source_label: row.source_label,
    source_url: row.source_url,
    district: row.district,
  };
}

export async function listFaqEntries(): Promise<FaqEntry[]> {
  const admin = getAdminSupabase();
  if (admin) {
    const { data } = await admin
      .from("faq_entries")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: true });
    if (data?.length) return data.map(fromRow);
  }
  return faqSeed as FaqEntry[];
}

export async function listFaqByCategory(): Promise<
  { category: string; label: string; entries: FaqEntry[] }[]
> {
  const entries = await listFaqEntries();
  const map = new Map<string, FaqEntry[]>();
  for (const e of entries) {
    const list = map.get(e.category) ?? [];
    list.push(e);
    map.set(e.category, list);
  }
  return [...map.entries()].map(([category, items]) => ({
    category,
    label: faqCategoryLabel(category),
    entries: items,
  }));
}
