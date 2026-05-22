import { Platform } from "react-native";
import * as Application from "expo-application";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FALLBACK_ID_KEY = "clt-device-id-fallback";

/**
 * Generates a random UUID, using the global `crypto.randomUUID()` if
 * available (React Native 0.74+), otherwise falls back to a Math.random
 * based implementation.
 */
const generateUUID = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4 UUID from Math.random
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Returns or creates a persistent random UUID stored in AsyncStorage.
 * This is used as a fallback when platform-specific device IDs are unavailable.
 */
const getOrCreateFallbackId = async (): Promise<string> => {
  const existing = await AsyncStorage.getItem(FALLBACK_ID_KEY);
  if (existing) return existing;
  const newId = generateUUID();
  await AsyncStorage.setItem(FALLBACK_ID_KEY, newId);
  return newId;
};

/**
 * Returns a stable device identifier.
 * - iOS: vendor UUID from `getIosIdForVendorAsync` (resets on uninstall).
 * - Android: `getAndroidId()` (settable; not guaranteed unique).
 * Falls back to a persistent random UUID stored in AsyncStorage on error or
 * unsupported platforms. Never returns a shared sentinel value.
 */
export const getDeviceIdAsync = async (): Promise<string> => {
  try {
    if (Platform.OS === "ios") {
      const id = await Application.getIosIdForVendorAsync();
      if (id) return id;
      return await getOrCreateFallbackId();
    }
    if (Platform.OS === "android") {
      const id = Application.getAndroidId();
      if (id) return id;
      return await getOrCreateFallbackId();
    }
    return await getOrCreateFallbackId();
  } catch {
    return await getOrCreateFallbackId();
  }
};

/** Synchronous shim — prefer `getDeviceIdAsync`. */
export const getDeviceId = (): string => {
  if (Platform.OS === "android") {
    const id = Application.getAndroidId();
    if (id) return id;
  }
  // Synchronous callers cannot use AsyncStorage; return empty string so the
  // async path is used instead. The rate limiter rejects empty deviceId via
  // Zod validation (deviceId: z.string().min(1)), so this is safe.
  return "";
};
