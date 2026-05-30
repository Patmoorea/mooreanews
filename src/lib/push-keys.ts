/**
 * Validation des clés Web Push (VAPID + subscription).
 */

export function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const trimmed = value.trim();
    const padding = "=".repeat((4 - (trimmed.length % 4)) % 4);
    const base64 = (trimmed + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Clé publique client push : 65 octets (point P-256 non compressé). */
export function isValidPushSubscriptionKeys(p256dh: string, auth: string): boolean {
  const p = decodeBase64Url(p256dh);
  const a = decodeBase64Url(auth);
  if (!p || !a) return false;
  return p.length === 65 && a.length === 16;
}

/** Clé VAPID publique serveur : 65 octets une fois décodée. */
export function isValidVapidPublicKey(publicKey: string): boolean {
  const buf = decodeBase64Url(publicKey);
  return buf !== null && buf.length === 65;
}

export function pushKeysErrorMessage(p256dh: string, auth: string): string {
  const p = decodeBase64Url(p256dh);
  const a = decodeBase64Url(auth);
  if (!p || !a) return "Clés push illisibles (base64).";
  if (p.length !== 65) {
    return `Clé p256dh invalide (${p.length} octets, attendu 65).`;
  }
  if (a.length !== 16) {
    return `Clé auth invalide (${a.length} octets, attendu 16).`;
  }
  return "Clés push invalides.";
}
