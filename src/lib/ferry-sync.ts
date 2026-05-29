/**
 * Vérification des sources horaires (cron).
 */

import { fetchFirebaseDepartures } from "@/lib/ferry-firebase";
import { fetchRawFerries } from "@/lib/ferries";

export async function checkFerryScheduleSync(): Promise<{
  live: boolean;
  companies: number;
  message: string;
}> {
  const [firebase, tahitiJson] = await Promise.all([
    fetchFirebaseDepartures(),
    fetchRawFerries(),
  ]);

  const parts: string[] = [];
  if (firebase.ok) {
    parts.push(
      `Aremiti+Vaeara'i OK (${firebase.fromMoorea.length + firebase.fromTahiti.length} départs)`,
    );
  } else {
    parts.push("Firebase compagnies : échec");
  }

  if (tahitiJson?.compagnies?.["Tauati Ferry"]) {
    parts.push("Tauati via horaires-tahiti.com");
  } else {
    parts.push("Tauati : cache local");
  }

  return {
    live: firebase.ok,
    companies: firebase.ok ? 2 : 0,
    message: parts.join(" · "),
  };
}
