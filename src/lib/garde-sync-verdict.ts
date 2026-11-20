/**
 * Verdict du workflow « Garde week-end » (date +%u, Tahiti).
 * Lun–mer sans tableau férié : pas un échec (pas d'email).
 * Tableau férié vu mais non publié : échec, comme un week-end manquant jeu–dim.
 */

function compactDoctorName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^dr\.?\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Contrôle optionnel avant de laisser une publication en place.
 * Aucune attente → pas d'écart. Un médecin, un téléphone ou une date faux → motif.
 */
export function gardePublishMismatch(
  snap: {
    validFrom?: string | null;
    validTo?: string | null;
    doctor?: { name?: string | null; phone?: string | null } | null;
  } | null,
  expect: {
    doctor?: string | null;
    phone?: string | null;
    validFrom?: string | null;
    validTo?: string | null;
  },
): string | null {
  const doctor = expect.doctor?.trim() ?? "";
  const phone = (expect.phone ?? "").replace(/\D/g, "");
  const from = expect.validFrom?.trim() ?? "";
  const to = expect.validTo?.trim() ?? "";
  if (!doctor && !phone && !from && !to) return null;
  if (!snap) return "aucun snapshot publié";
  if (from && snap.validFrom !== from) return `validFrom ${snap.validFrom ?? "?"} ≠ ${from}`;
  if (to && snap.validTo !== to) return `validTo ${snap.validTo ?? "?"} ≠ ${to}`;
  if (doctor && compactDoctorName(snap.doctor?.name ?? "") !== compactDoctorName(doctor)) {
    return `médecin « ${snap.doctor?.name ?? ""} » ≠ « ${doctor} »`;
  }
  const gotPhone = (snap.doctor?.phone ?? "").replace(/\D/g, "");
  if (phone && gotPhone !== phone) return `téléphone ${snap.doctor?.phone ?? "?"} ≠ ${phone}`;
  return null;
}

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
