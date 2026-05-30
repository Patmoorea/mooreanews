/**
 * Client Web Push — enregistrement SW + abonnement VAPID.
 */

import {
  decodeBase64Url,
  isValidVapidPublicKey,
} from "@/lib/push-keys";

const SW_URL = "/sw.js";
const PUSH_OK_KEY = "mooreanews-push-ok";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isPushMarkedActive(): boolean {
  try {
    return localStorage.getItem(PUSH_OK_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPushActive(active: boolean): void {
  try {
    if (active) localStorage.setItem(PUSH_OK_KEY, "1");
    else localStorage.removeItem(PUSH_OK_KEY);
  } catch {
    /* ignore */
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const decoded = decodeBase64Url(base64String);
  if (!decoded) throw new Error("Clé VAPID illisible");
  return decoded;
}

/** Enregistre le SW et attend qu'il soit prêt. */
export async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register(SW_URL);
  await navigator.serviceWorker.ready;
  return reg;
}

export type PushSubscribeResult =
  | { ok: true; districts: string[] }
  | { ok: false; reason: "unsupported" | "denied" | "not_configured" | "failed"; message?: string };

function pushErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  const msg = err instanceof Error ? err.message : String(err);
  if (name === "NotAllowedError" || /permission/i.test(msg)) {
    return "Autorisez les notifications dans les réglages du navigateur.";
  }
  if (/push service error|Registration failed/i.test(msg)) {
    return "Service push refusé — utilisez Chrome, Firefox ou Safari (PWA installée), pas un navigateur intégré.";
  }
  if (/different applicationServerKey|vapid|key/i.test(msg)) {
    return "Clés VAPID changées — réessayez après avoir vidé le cache du site.";
  }
  if (/service worker/i.test(msg)) {
    return "Service worker indisponible — rechargez la page ou installez l’app PWA.";
  }
  return msg.slice(0, 200) || "Erreur lors de l’abonnement push.";
}

async function fetchVapidPublicKey(): Promise<string | null> {
  const res = await fetch("/api/push/vapid");
  const text = await res.text();
  try {
    const data = JSON.parse(text) as { ok: boolean; publicKey?: string };
    return data.ok && data.publicKey ? data.publicKey : null;
  } catch {
    return null;
  }
}

async function saveSubscriptionOnServer(
  subscription: PushSubscription,
  districts: string[],
): Promise<{ ok: true; districts: string[] } | { ok: false; message: string }> {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), districts }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return {
      ok: false,
      message: body.error ?? `Serveur (${res.status}) — vérifiez Supabase.`,
    };
  }

  const data = (await res.json()) as { districts?: string[] };
  return { ok: true, districts: data.districts ?? districts };
}

/** Met à jour les quartiers sans recréer l’abonnement navigateur. */
export async function syncPushDistricts(districts: string[]): Promise<void> {
  if (!isPushSupported() || !isPushMarkedActive()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      markPushActive(false);
      return;
    }
    await saveSubscriptionOnServer(sub, districts);
  } catch {
    /* silencieux */
  }
}

/** Demande permission, s'abonne et enregistre côté serveur. */
export async function subscribeToPushAlerts(
  districts: string[],
): Promise<PushSubscribeResult> {
  if (!isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      return { ok: false, reason: "denied" };
    }

    const publicKey = await fetchVapidPublicKey();
    if (!publicKey) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Clé VAPID publique absente sur Vercel.",
      };
    }
    if (!isValidVapidPublicKey(publicKey)) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Clé VAPID publique invalide sur Vercel (regénérez la paire).",
      };
    }

    const reg = await ensureServiceWorkerReady();
    const applicationServerKey = urlBase64ToUint8Array(
      publicKey,
    ) as BufferSource;

    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const saved = await saveSubscriptionOnServer(sub, districts);
    if (!saved.ok) {
      return { ok: false, reason: "failed", message: saved.message };
    }

    markPushActive(true);
    return { ok: true, districts: saved.districts };
  } catch (err) {
    return { ok: false, reason: "failed", message: pushErrorMessage(err) };
  }
}
