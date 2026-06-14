/**
 * Enrichissement IA async des signalements (après création).
 */

import { after } from "next/server";
import { analyzeSignalementWithAi } from "@/lib/ai-moorea";
import { getSignalementCategory } from "@/lib/signalement-categories";
import type { SignalementInput } from "@/lib/signalement-submit";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";

export async function enrichSignalementWithAi(
  submissionId: string,
  input: SignalementInput,
): Promise<{ ok: boolean; error?: string }> {
  const cat = getSignalementCategory(input.categoryId);
  const analysis = await analyzeSignalementWithAi({
    categoryId: cat.id,
    categoryLabel: cat.label,
    description: input.description,
    location: input.location,
    district: input.district,
  });

  if (!analysis) {
    return { ok: false, error: "ai_unavailable" };
  }

  const note = [
    `[IA ${new Date().toISOString()}]`,
    `Résumé : ${analysis.summary}`,
    `Urgent suggéré : ${analysis.urgent ? "oui" : "non"}`,
    `Titre alerte : ${analysis.suggestedAlertTitle}`,
    `Confiance : ${analysis.confidence}`,
    analysis.flags.length ? `Flags : ${analysis.flags.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const supabase = getAdminSupabase();
  if (supabase) {
    const { data: existing } = await supabase
      .from("submissions")
      .select("admin_notes")
      .eq("id", submissionId)
      .maybeSingle();

    const merged = [existing?.admin_notes, note].filter(Boolean).join("\n\n");
    await supabase
      .from("submissions")
      .update({ admin_notes: merged })
      .eq("id", submissionId);
  }

  await sendTelegramNotification(
    [
      `<b>🤖 Analyse IA — signalement</b>`,
      `<i>${escapeHtml(cat.label)}</i>`,
      "",
      escapeHtml(analysis.summary),
      "",
      analysis.urgent ? "⚠️ <b>Urgent suggéré</b>" : "ℹ️ Non urgent",
      `Titre proposé : <b>${escapeHtml(analysis.suggestedAlertTitle)}</b>`,
      analysis.flags.length
        ? `Flags : ${escapeHtml(analysis.flags.join(", "))}`
        : "",
      "",
      `<a href="https://www.mooreanews.com/admin/submissions">Modérer →</a>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return { ok: true };
}

/** Lance l’analyse IA après la réponse HTTP (route handler uniquement). */
export function scheduleSignalementAiEnrichment(
  submissionId: string,
  input: SignalementInput,
): void {
  after(async () => {
    try {
      await enrichSignalementWithAi(submissionId, input);
    } catch (err) {
      console.error("[ai-signalement-enrich]", err);
    }
  });
}
