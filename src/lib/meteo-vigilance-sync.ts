/**
 * Synchronise la vigilance meteo.pf vers la table alerts.
 */

import {
  fetchMeteoVigilance,
  METEO_VIGILANCE_SOURCE_ID,
  vigilanceAlertTitle,
  vigilanceNeedsAlert,
  type MeteoVigilanceSnapshot,
} from "@/lib/meteo-vigilance";
import { getAdminSupabase } from "@/lib/supabase/admin";

export type MeteoVigilanceSyncResult = {
  synced: boolean;
  action: "created" | "updated" | "cleared" | "unchanged" | "skipped" | "error";
  title?: string;
  mooreaLevel?: number;
  error?: string;
};

async function findExistingVigilanceAlert() {
  const admin = getAdminSupabase();
  if (!admin) return null;

  const { data } = await admin
    .from("alerts")
    .select("*")
    .eq("type", "meteo")
    .eq("source_url", METEO_VIGILANCE_SOURCE_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

function snapshotFingerprint(snapshot: MeteoVigilanceSnapshot): string {
  const zones = snapshot.mooreaZones
    .map((z) => `${z.id}:${z.maxColorId}`)
    .join(",");
  return `${snapshot.updateTime}|${snapshot.mooreaMaxColorId}|${snapshot.cycloneMaxColorId}|${zones}`;
}

/** Met à jour ou désactive l'alerte vigilance officielle. */
export async function syncMeteoVigilanceAlert(): Promise<MeteoVigilanceSyncResult> {
  const admin = getAdminSupabase();
  if (!admin) {
    return { synced: false, action: "skipped", error: "Supabase absent" };
  }

  let snapshot: MeteoVigilanceSnapshot;
  try {
    snapshot = await fetchMeteoVigilance();
  } catch (e) {
    return {
      synced: false,
      action: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const existing = await findExistingVigilanceAlert();
  const needsAlert = vigilanceNeedsAlert(snapshot);
  const now = new Date().toISOString();
  const endsAt = new Date(snapshot.endValidityTime * 1000).toISOString();

  if (!needsAlert) {
    if (existing?.active) {
      await admin
        .from("alerts")
        .update({ active: false, updated_at: now })
        .eq("id", existing.id);
      return {
        synced: true,
        action: "cleared",
        mooreaLevel: snapshot.mooreaMaxColorId,
      };
    }
    return {
      synced: true,
      action: "unchanged",
      mooreaLevel: snapshot.mooreaMaxColorId,
    };
  }

  const title = vigilanceAlertTitle(snapshot);
  const fingerprint = snapshotFingerprint(snapshot);
  const details = `${snapshot.details}\n\nRef. ${fingerprint}`;

  if (existing) {
    const sameState =
      existing.active &&
      existing.title === title &&
      existing.urgent === snapshot.urgent &&
      existing.details?.includes(String(snapshot.updateTime));

    if (sameState) {
      return {
        synced: true,
        action: "unchanged",
        title,
        mooreaLevel: snapshot.mooreaMaxColorId,
      };
    }

    const { data: updated, error } = await admin
      .from("alerts")
      .update({
        severity: snapshot.severity,
        title,
        details,
        source_url: METEO_VIGILANCE_SOURCE_ID,
        starts_at: now,
        ends_at: endsAt,
        active: true,
        urgent: snapshot.urgent,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      return { synced: false, action: "error", error: error.message };
    }

    const wasInactive = !existing.active;
    const levelIncreased =
      (existing.details?.match(/\|(\d+)\|/)?.[1] ?? "0") <
      String(snapshot.mooreaMaxColorId);

    if (wasInactive || levelIncreased) {
      try {
        const { notifyAlertSubscribers } = await import("@/lib/push-notify");
        if (updated) await notifyAlertSubscribers(updated);
      } catch {
        /* non bloquant */
      }
    }

    return {
      synced: true,
      action: "updated",
      title,
      mooreaLevel: snapshot.mooreaMaxColorId,
    };
  }

  const { data: inserted, error } = await admin
    .from("alerts")
    .insert({
      type: "meteo",
      severity: snapshot.severity,
      title,
      details,
      source_url: METEO_VIGILANCE_SOURCE_ID,
      starts_at: now,
      ends_at: endsAt,
      active: true,
      urgent: snapshot.urgent,
    })
    .select("*")
    .single();

  if (error) {
    return { synced: false, action: "error", error: error.message };
  }

  try {
    const { notifyAlertSubscribers } = await import("@/lib/push-notify");
    if (inserted) await notifyAlertSubscribers(inserted);
  } catch {
    /* non bloquant */
  }

  return {
    synced: true,
    action: "created",
    title,
    mooreaLevel: snapshot.mooreaMaxColorId,
  };
}
