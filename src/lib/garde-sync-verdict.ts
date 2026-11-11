/**
 * Verdict du workflow « Garde week-end » (date +%u, Tahiti).
 * Lun–mer sans tableau férié : pas un échec (pas d'email).
 * Tableau férié vu mais non publié : échec, comme un week-end manquant jeu–dim.
 */

export function gardeRunShouldFail(
  result: {
    ok?: boolean;
    found?: boolean;
    doctor?: string | null;
    holidayRoster?: boolean;
  },
  tahitiDow: number,
): boolean {
  const doctor = result.doctor?.trim() ?? "";
  const published = result.ok === true && result.found === true && doctor.length > 0;
  if (published) return false;
  if (tahitiDow >= 1 && tahitiDow <= 3 && result.holidayRoster !== true) return false;
  return true;
}
