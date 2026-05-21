const DEVICE_ID_KEY = "clt-device-id";

/**
 * Returns a persistent device ID from localStorage.
 * Generates and stores a UUID if none exists.
 * Safe to call in a browser-only context (not SSR).
 */
export function getDeviceId(): string {
  if (typeof localStorage === "undefined") return "";

  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
