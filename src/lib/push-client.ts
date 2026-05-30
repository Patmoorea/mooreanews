/**
 * Client Web Push — enregistrement SW + abonnement VAPID.
 */

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
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
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

/** Demande permission, s'abonne et enregistre côté serveur. */
export async function subscribeToPushAlerts(
  districts: string[],
): Promise<PushSubscribeResult> {
  if (!isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    return { ok: false, reason: "denied" };
  }

  const vapidRes = await fetch("/api/push/vapid");
  const vapid = (await vapidRes.json()) as { ok: boolean; publicKey?: string };
  if (!vapid.ok || !vapid.publicKey) {
    return {
      ok: false,
      reason: "not_configured",
      message: "VAPID non configuré sur le serveur.",
    };
  }

  const reg = await ensureServiceWorkerReady();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapid.publicKey,
      ) as BufferSource,
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), districts }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return {
      ok: false,
      reason: "failed",
      message: body.error ?? "Enregistrement serveur impossible.",
    };
  }

  const data = (await res.json()) as { districts?: string[] };
  markPushActive(true);
  return { ok: true, districts: data.districts ?? districts };
}
