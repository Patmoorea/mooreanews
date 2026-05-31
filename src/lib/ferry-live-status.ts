/**
 * Statut live des traversées (Firebase Aremiti / Vaeara'i).
 * Codes observés sur les apps officielles — affichage prudent si inconnu.
 */

export type FerryLiveStatus = "on_time" | "boarding" | "delayed" | "cancelled";

export function ferryStatusFromFirebaseCode(
  status: number | undefined,
): FerryLiveStatus | null {
  if (status == null || Number.isNaN(status)) return null;
  if (status === 4 || status === 5 || status === 99) return "cancelled";
  if (status === 3 || status === 1) return "delayed";
  if (status === 2) return "boarding";
  if (status === 0) return "on_time";
  return null;
}

export function ferryStatusLabel(s: FerryLiveStatus): string {
  switch (s) {
    case "on_time":
      return "À l'heure";
    case "boarding":
      return "Embarquement";
    case "delayed":
      return "Retard";
    case "cancelled":
      return "Annulé";
  }
}

export function ferryStatusClass(s: FerryLiveStatus): string {
  switch (s) {
    case "on_time":
      return "bg-lagon-100 text-lagon-800";
    case "boarding":
      return "bg-soleil-100 text-soleil-800";
    case "delayed":
      return "bg-tiare-100 text-tiare-800";
    case "cancelled":
      return "bg-tiare-200 text-tiare-900 line-through";
  }
}
