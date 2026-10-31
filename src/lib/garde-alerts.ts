/**
 * Alertes Telegram garde Moorea — une seule par week-end ET par cause,
 * avec un message qui dit la vraie raison (affiche pas encore publiée ≠ OCR ≠ validation).
 */
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getTahitiClock } from "@/lib/cron-tahiti";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import { COPPF_MEDECINS_GARDE_URL } from "@/lib/garde-ordre-pharmaciens";

export type GardeFailureCause =
  /** Aucune affiche COPPF datée du week-end attendu (pas encore publiée). */
  | "affiche_non_publiee"
  /** Affiche du week-end présente mais OCR en échec / ligne Moorea illisible. */
  | "ocr"
  /** Ligne Moorea lue mais refusée par les garde-fous (n°, horaires, dates…). */
  | "validation"
  /** Exception (réseau, Supabase…). */
  | "erreur";

export function classifyGardeFailure(input: {
  posterForWeekend: boolean;
  officialForWeekend: boolean;
  officialRead: boolean;
  exception?: boolean;
}): GardeFailureCause {
  if (input.exception) return "erreur";
  if (input.officialForWeekend) return "validation";
  if (!input.posterForWeekend) return "affiche_non_publiee";
  return input.officialRead ? "validation" : "ocr";
}

export function gardeFailureText(cause: GardeFailureCause): string {
  switch (cause) {
    case "affiche_non_publiee":
      return "L’affiche COPPF de ce week-end n’est pas encore publiée (aucune image datée du week-end). Nouvel essai automatique au prochain passage.";
    case "ocr":
      return "L’affiche du week-end est en ligne mais la ligne Moorea n’a pas pu être lue (OCR).";
    case "validation":
      return "La ligne Moorea a été lue mais refusée par les contrôles (rien n’est publié sans vérification).";
    default:
      return "Erreur technique pendant la synchronisation.";
  }
}

/** Faut-il alerter pour cette cause maintenant ? (lun–mer : jamais ; « pas encore publiée » : à partir de ven. 12h). */
export function shouldAlertGardeNow(cause: GardeFailureCause, now = new Date()): boolean {
  const { weekday, hour } = getTahitiClock(now);
  if (weekday >= 1 && weekday <= 3) return false;
  if (cause === "affiche_non_publiee") {
    if (weekday === 4) return false;
    if (weekday === 5 && hour < 12) return false;
  }
  return true;
}

/** Réserve la clé « week-end + cause ». false = déjà alerté. */
async function claimAlertKey(key: string, resetAt: string): Promise<boolean> {
  const admin = getAdminSupabase();
  if (!admin) return true;
  const { data: row } = await admin
    .from("form_rate_limits")
    .select("id")
    .eq("id", key)
    .maybeSingle();
  if (row) return false;
  const { error } = await admin.from("form_rate_limits").insert({ id: key, hits: 1, reset_at: resetAt });
  // Conflit = un autre run vient d'alerter.
  if (error && /duplicate|23505/i.test(`${error.code} ${error.message}`)) return false;
  return true;
}

export async function notifyGardeFailureOnce(input: {
  cause: GardeFailureCause;
  weekendFrom: string;
  weekendTo: string;
  detail?: string;
  now?: Date;
}): Promise<{ sent: boolean; reason?: string }> {
  const now = input.now ?? new Date();
  if (!shouldAlertGardeNow(input.cause, now)) return { sent: false, reason: "hors créneau" };
  const key = `garde-alert:${input.weekendFrom}:${input.cause}`;
  const resetAt = new Date(`${input.weekendTo}T23:59:00-10:00`).toISOString();
  if (!(await claimAlertKey(key, resetAt))) return { sent: false, reason: "déjà alerté" };

  const lines = [
    `<b>⚠️ Garde Moorea ${escapeHtml(input.weekendFrom)} → ${escapeHtml(input.weekendTo)}</b>`,
    "",
    escapeHtml(gardeFailureText(input.cause)),
    input.detail ? `Détail : ${escapeHtml(input.detail.slice(0, 300))}` : "",
    "",
    `<a href="${COPPF_MEDECINS_GARDE_URL}">COPPF — médecins de garde</a>`,
    `<a href="https://www.mooreanews.com/admin">Admin MooreaNews</a>`,
    "(1 alerte max. par week-end et par cause)",
  ].filter(Boolean);
  await sendTelegramNotification(lines.join("\n"));
  return { sent: true };
}
